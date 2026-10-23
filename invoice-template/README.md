# Annapolis IMT Cleaning Services — Invoice Template

A reusable, print-ready invoice for Annapolis IMT Cleaning Services, styled from the official IMT logo (black `#0D0D0D` + metallic gold `#B0843A`, on white with warm neutrals).

| File | Purpose |
| --- | --- |
| `invoice.html` | **The editable template.** Open it in Chrome, Edge, or Safari, fill it in, and print or save it as a PDF. |
| `assets/imt-logo.png` | Official logo, with only the surrounding white space trimmed (proportions and colors unchanged). |
| `assets/imt-logo-original.png` | Untouched original logo file. |
| `pdf/IMT-Invoice-Template.pdf` | Blank, print-ready preview with every field hint visible. |
| `pdf/IMT-Invoice-Sample.pdf` | Filled-in demo marked **SAMPLE**, showing the calculations. Not a real customer or transaction. |
| `scripts/render-pdf.mjs` | Regenerates both PDFs: `node invoice-template/scripts/render-pdf.mjs` (needs Playwright). |

Keep the `assets/` folder next to `invoice.html` so the logo loads.

## Creating an invoice for a new customer

1. **Open `invoice.html`** and click **New Blank Invoice**.
2. **Header:** click **New Invoice #** (generates `IMT-YYYYMMDD-01`, `-02`, …) and **Issue Date = Today**. Type the payment due date and choose a status (Draft, Unpaid, Partially Paid, Paid, Overdue). The status pill changes color.
3. **Bill To / Service Location:** click any gray hint and type over it. If the cleaning happens at the billing address, click **Same as billing**. Pick the property type.
4. **Booking & appointment:** enter the reservation date, scheduled cleaning date, and arrival time. Leave **Actual Cleaning Date** blank until the job is finished; it prints as "Pending". Use the Estimated/Actual switch for duration.
5. **Cleaning visits this month** (for recurring customers): enter the service month and frequency, then add one line per visit with its date, service, team, and status (Completed, Scheduled, Cancelled, Rescheduled). **+ Add visit** adds more lines. The badge counts **completed cleanings** automatically and also shows how many are still scheduled. If no visits are entered, the section is left off the printout, as on a one-time cleaning invoice. If you bill per visit, enter the completed count as the **Qty** on the service line.
6. **Services:** choose a service from the suggestions (Standard, Deep, Move-In/Move-Out, Airbnb Turnover, Office, Commercial, Bathroom, Kitchen, Windows, Refrigerator, Oven, Laundry/Linen, Additional Room, Special Request) or type your own. Then enter the area, quantity, and unit price. **+ Add service line** adds a row, and the **×** on the right removes one.
7. **Additional charges:** add these only when the customer has approved them (additional labor, excessive buildup, special supplies, pet hair, other add-ons). The section is hidden on the printed invoice when it is empty.
8. **Summary:** enter a discount (% or $) or tax (% or $) only if it applies. Tax is never added automatically. Enter any deposit received and previous payments.
9. **Payment information:** set the method, payment date, and transaction ID. Edit the payment instructions if needed.
10. **Notes:** fill only the service-note lines you need. Empty lines are left off the printout. The red **Internal Notes** box under the page is for staff and is **never printed**.
11. **Terms:** replace each highlighted placeholder, such as `[Payment Terms]` or `[Cancellation Policy]`, with your actual policy. You can do this once in the file itself so every invoice includes it. The toolbar counts how many bracketed placeholders are left.
12. Click **Print / Save PDF**, choose **Save as PDF**, paper size **Letter**, and turn on **Background graphics**.

**Saving records:** **Save Draft** and **Load Draft** keep one invoice in this browser. **Export Data** downloads the invoice as a `.json` file, and **Import Data** reopens it later.

## How the math works

- Line total = quantity × unit price (rounded to the cent)
- **Subtotal** = sum of service lines
- **Discount** = % of subtotal, or a fixed $ amount (never more than the subtotal)
- **Additional Fees** = sum of approved additional-charge lines
- **Tax** = % of (subtotal − discount + additional fees), or a fixed $ amount
- **Total Invoice Amount** = subtotal − discount + additional fees + tax
- **Balance Due** = total − deposit received − previous payments (shown with "CR" if overpaid)

When printing with **Hide unfilled hints** checked (the default), discount, fee, and tax rows that equal $0 are left out, and so are empty optional fields. A typical invoice fits on one Letter page. Longer invoices continue onto a second page, and the table header repeats on each page.

## Permanent customizations

Edit `invoice.html` in a text editor:

- **Terms & Conditions:** the `<p ... data-k="t1">` … `t5` paragraphs.
- **Payment instructions:** the `data-k="payInstr"` block.
- **Service suggestions:** the `<datalist id="svcList">` and `id="extraList"` options.
- **Brand colors:** the CSS variables at the top (`--ink`, `--gold`, …).
