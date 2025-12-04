import { useMemo, useState } from 'react';

const defaultForm = {
  name: 'Ava Highworth',
  currentAge: 42,
  retirementAge: 60,
  savings: 850000,
  mortgage: 320000,
  usHome: 1200000,
  usRental: 650000,
  investments: 1750000,
  investmentGrowth: 7,
  investmentWithdrawal: 4,
  indiaHome: 350000,
  indiaRental: 180000,
  balance529: 160000,
  son: { amount: 32000, startAge: 18, endAge: 22 },
  daughter: { amount: 28000, startAge: 18, endAge: 22 },
  retirementExpense: 140000,
  medicalExpense: 18000,
  travelExpense: 15000,
};

const defaultOther = [
  { id: crypto.randomUUID(), age: 55, amount: 90000, note: 'Lake house splash' },
];

const toNumber = (value) => Number(value) || 0;
const formatMoney = (value) =>
  '$' + Math.round(value).toLocaleString('en-US', { maximumFractionDigits: 0 });

function buildPlan(form, otherExpenses = []) {
  const rows = [];
  let savings = toNumber(form.savings);
  let mortgage = toNumber(form.mortgage);
  let investments = toNumber(form.investments);
  let usHome = toNumber(form.usHome);
  let usRental = toNumber(form.usRental);
  let indiaHome = toNumber(form.indiaHome);
  let indiaRental = toNumber(form.indiaRental);
  let plan529 = toNumber(form.balance529);

  const investmentGrowthRate = toNumber(form.investmentGrowth) / 100;
  const withdrawalRate = toNumber(form.investmentWithdrawal) / 100;

  for (let age = toNumber(form.currentAge); age <= 100; age++) {
    const isRetired = age >= toNumber(form.retirementAge);
    let educationExpense = 0;
    let amountForExpense = 0;

    if (age < toNumber(form.retirementAge)) {
      savings += 50000;
    }

    const withinRange = (child) => age >= toNumber(child.startAge) && age <= toNumber(child.endAge);
    if (withinRange(form.son)) educationExpense += toNumber(form.son.amount);
    if (withinRange(form.daughter)) educationExpense += toNumber(form.daughter.amount);

    const from529 = Math.min(plan529, educationExpense);
    plan529 -= from529;
    const educationFromSavings = educationExpense - from529;
    savings -= educationFromSavings;

    const timedExpenses = otherExpenses
      .filter((item) => item.age === age)
      .reduce((sum, item) => sum + toNumber(item.amount), 0);
    savings -= timedExpenses;

    if (isRetired) {
      savings -= toNumber(form.retirementExpense);
      savings -= toNumber(form.travelExpense);
      if (age < 65) {
        savings -= toNumber(form.medicalExpense);
      } else {
        savings -= 12000;
      }
    }

    if (mortgage > 0) {
      mortgage *= 0.94;
    }
    if (age === toNumber(form.retirementAge) + 1 && mortgage > 0) {
      savings -= mortgage;
      mortgage = 0;
    }

    if (age < 65) {
      investments *= 1 + investmentGrowthRate;
    } else {
      amountForExpense = investments * withdrawalRate;
      investments -= amountForExpense;
      investments *= 1 + investmentGrowthRate;
      savings += amountForExpense * 0.7;
    }

    usHome *= 1.05;
    usRental *= 1.05;
    indiaHome *= 1.05;
    indiaRental *= 1.05;

    rows.push({
      year: age,
      savings,
      educationExpense,
      plan529,
      mortgage,
      investments,
      amountForExpense,
      usHome,
      usRental,
      indiaHome,
      indiaRental,
      timedExpenses,
    });
  }

  const header =
    '| Year | Savings | Education Expense | 529 | Home Mortgage | Investment | Amount for Expense (4%) | US Home Price | US Rental homes Price | India Home Price | Indian Rental homes Price |';
  const divider = '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const lines = rows.map((row) =>
    [
      row.year,
      formatMoney(row.savings),
      formatMoney(row.educationExpense + row.timedExpenses),
      formatMoney(row.plan529),
      formatMoney(row.mortgage),
      formatMoney(row.investments),
      formatMoney(row.amountForExpense),
      formatMoney(row.usHome),
      formatMoney(row.usRental),
      formatMoney(row.indiaHome),
      formatMoney(row.indiaRental),
    ].join(' | ')
  );

  const markdown = [header, divider, ...lines.map((line) => `| ${line} |`)].join('\n');

  return { rows, markdown };
}

function NumberInput({ label, value, onChange, step = 'any' }) {
  return (
    <div>
      <label>{label}</label>
      <input type="number" value={value} step={step} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function OtherExpenses({ items, setItems }) {
  const update = (id, field, value) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));

  const addItem = () => setItems((prev) => [...prev, { id: crypto.randomUUID(), age: 50, amount: 25000, note: '' }]);

  const remove = (id) => setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className="other-list">
      {items.map((item) => (
        <div key={item.id} className="other-row">
          <input
            type="number"
            value={item.amount}
            onChange={(e) => update(item.id, 'amount', Number(e.target.value) || 0)}
            placeholder="Amount"
          />
          <input
            type="number"
            value={item.age}
            onChange={(e) => update(item.id, 'age', Number(e.target.value) || 0)}
            placeholder="Age"
          />
          <button type="button" className="secondary" onClick={() => remove(item.id)}>
            ✕
          </button>
          <input
            type="text"
            value={item.note || ''}
            onChange={(e) => update(item.id, 'note', e.target.value)}
            placeholder="Note"
            style={{ gridColumn: '1 / -1' }}
          />
        </div>
      ))}
      <button type="button" onClick={addItem} className="secondary">
        + Add planned expense
      </button>
    </div>
  );
}

function App() {
  const [form, setForm] = useState(defaultForm);
  const [otherExpenses, setOtherExpenses] = useState(defaultOther);

  const { rows, markdown } = useMemo(() => buildPlan(form, otherExpenses), [form, otherExpenses]);
  const retirementRow = rows.find((row) => row.year === Number(form.retirementAge));
  const age65Row = rows.find((row) => row.year === 65);

  const updateField = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateChild = (child, field) => (value) =>
    setForm((prev) => ({ ...prev, [child]: { ...prev[child], [field]: value } }));

  return (
    <div className="page">
      <header>
        <h1>Luxe Retirement Forecaster</h1>
        <p>
          Crafted by your resident witty fiduciary. I'll keep the math honest, your optimism intact, and the humor pleasantly
          dry.
        </p>
        <div className="pill">
          <span>🎯</span>
          <span>Years modeled: {form.currentAge} → 100 | Retirement at age {form.retirementAge}</span>
        </div>
      </header>

      <div className="grid">
        <div className="card">
          <h2>Personal basics</h2>
          <div className="inline">
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => updateField('name')(e.target.value)} />
            </div>
            <NumberInput label="Current age" value={form.currentAge} onChange={updateField('currentAge')} />
            <NumberInput label="Planned retirement age" value={form.retirementAge} onChange={updateField('retirementAge')} />
          </div>
        </div>

        <div className="card">
          <h2>Liquid holdings</h2>
          <div className="inline">
            <NumberInput label="Savings balance" value={form.savings} onChange={updateField('savings')} />
            <NumberInput label="529 balance" value={form.balance529} onChange={updateField('balance529')} />
            <NumberInput label="Investments" value={form.investments} onChange={updateField('investments')} />
            <NumberInput
              label="Investment growth % (yearly)"
              value={form.investmentGrowth}
              onChange={updateField('investmentGrowth')}
            />
            <NumberInput
              label="Withdrawal % from 65"
              value={form.investmentWithdrawal}
              onChange={updateField('investmentWithdrawal')}
            />
          </div>
        </div>

        <div className="card">
          <h2>Real estate</h2>
          <div className="inline">
            <NumberInput label="US home value" value={form.usHome} onChange={updateField('usHome')} />
            <NumberInput label="US rental value (all)" value={form.usRental} onChange={updateField('usRental')} />
            <NumberInput label="India home value" value={form.indiaHome} onChange={updateField('indiaHome')} />
            <NumberInput label="India rental value (all)" value={form.indiaRental} onChange={updateField('indiaRental')} />
            <NumberInput label="Mortgage pending" value={form.mortgage} onChange={updateField('mortgage')} />
          </div>
          <p className="footer-note">Values grow 5% yearly; mortgage shrinks 6% yearly then is paid off one year after retirement.</p>
        </div>

        <div className="card">
          <h2>Education</h2>
          <div className="inline">
            <NumberInput label="Son yearly cost" value={form.son.amount} onChange={updateChild('son', 'amount')} />
            <NumberInput label="Son start age" value={form.son.startAge} onChange={updateChild('son', 'startAge')} />
            <NumberInput label="Son end age" value={form.son.endAge} onChange={updateChild('son', 'endAge')} />
            <NumberInput label="Daughter yearly cost" value={form.daughter.amount} onChange={updateChild('daughter', 'amount')} />
            <NumberInput label="Daughter start age" value={form.daughter.startAge} onChange={updateChild('daughter', 'startAge')} />
            <NumberInput label="Daughter end age" value={form.daughter.endAge} onChange={updateChild('daughter', 'endAge')} />
          </div>
          <p className="footer-note">Tuition taps 529 first; once empty, savings pick up the tab.</p>
        </div>

        <div className="card">
          <h2>Retirement cash flow</h2>
          <div className="inline">
            <NumberInput
              label="Yearly expense after retirement"
              value={form.retirementExpense}
              onChange={updateField('retirementExpense')}
            />
            <NumberInput label="Medical (until 65)" value={form.medicalExpense} onChange={updateField('medicalExpense')} />
            <NumberInput label="Yearly travel expense" value={form.travelExpense} onChange={updateField('travelExpense')} />
          </div>
          <p className="footer-note">
            Working years before 65 assume salary covers lifestyle and travel. After retirement, these pull from savings.
          </p>
        </div>

        <div className="card">
          <h2>Other planned expenses</h2>
          <OtherExpenses items={otherExpenses} setItems={setOtherExpenses} />
          <p className="footer-note">Enter age and amount for one-off spends (weddings, yachts, or surprise hobbies).</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => setForm(defaultForm)}>Reset to defaults</button>
        <button className="secondary" onClick={() => navigator.clipboard.writeText(markdown)}>
          Copy markdown table
        </button>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h2>Advisor's quippy readout</h2>
        <div className="summary">
          <div className="summary-item">
            <strong>Retirement year snapshot (age {form.retirementAge})</strong>
            {retirementRow ? (
              <p>
                Savings {formatMoney(retirementRow.savings)} | Investments {formatMoney(retirementRow.investments)} | Mortgage{' '}
                {formatMoney(retirementRow.mortgage)}
              </p>
            ) : (
              <p>We'll fill this once ages look reasonable.</p>
            )}
          </div>
          <div className="summary-item">
            <strong>Age 65 investment draw</strong>
            {age65Row ? (
              <p>
                Withdrawal {formatMoney(age65Row.amountForExpense)} → {formatMoney(age65Row.amountForExpense * 0.7)} added to
                savings
              </p>
            ) : (
              <p>No age 65 yet in the model.</p>
            )}
          </div>
          <div className="summary-item">
            <strong>Humane hint</strong>
            <p>
              Keep an eye on education timing—529 funds are your first line. Mortgage disappears one year after retirement,
              freeing cash flow.
            </p>
          </div>
          <div className="summary-item">
            <strong>Questions for you</strong>
            <p>
              What else would you like to see—Roth conversions, Social Security timing, or charitable trusts? I'm all ears and
              spreadsheets.
            </p>
          </div>
        </div>
        <p className="footer-note" style={{ marginTop: '10px' }}>
          Suggestion: consider adjusting the withdrawal rate for the first 10 retirement years or staging travel spending; both
          can smooth the glide path while keeping lifestyle sparkling.
        </p>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h2>Markdown table (copy/paste into your favorite doc)</h2>
        <textarea className="markdown" value={markdown} readOnly />
        <p className="footer-note">Need an Excel download? Holler and I'll package the sheet. For now, it's markdown to keep things lean.</p>
      </div>
    </div>
  );
}

export default App;
