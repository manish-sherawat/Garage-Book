# Project Rules & Custom Patterns

## Autofill 2
When the user asks to implement **"Autofill 2"** in any system or feature:
- **Concept**: A live inline autocomplete system directly integrated into text fields (e.g. Customer Name).
- **Key Mechanics**:
  1. **Live Filter on Typing**: As letters are entered, filter available records from the reference dataset (e.g. Customer Registry).
  2. **Single Custom Floating Dropdown**: Render a clean floating suggestions popup (`position: absolute`) below the input field. Do NOT use native HTML `<datalist>` to prevent duplicate dropdowns.
  3. **Instant Multi-Field Auto-Fill**: Selecting any suggestion populates all related input fields (e.g. Name, Phone, Address) and displays a green match badge (`✓ Auto-filled / Matched`).
  4. **Smooth Dismissal**: Close the popup on item selection, clear button press, or input blur (`onBlur`).
  5. **Auto-Registering New Entries**: If a user enters a new record manually, automatically save it to the registry for future fast entries.

## pagebutton
When the user asks to implement **"pagebutton"** (or pagination) in any table or list view:
- **Concept**: A built-in zero-lag pagination system with page navigation controls and items-per-page selectors.
- **Key Mechanics**:
  1. **Fast Paginated Slicing**: Render only the active page's slice (`items.slice(startIndex, endIndex)`) to prevent browser lag on long data lists.
  2. **Items Per Page Selector**: Provide a dropdown to select `10`, `20`, `50`, or `100` items per page.
  3. **Page Navigation Controls**: Render `Previous`, `Next`, and numbered page pills with active page highlighting.
  4. **Auto-Reset on Filter/Search**: Automatically reset `currentPage` to 1 whenever search filters or new entries/imports are applied.

## Parts & Inventory Management Standard
When the user asks to implement or update the **"Parts & Inventory System"**:
- **Concept**: A streamlined parts inventory catalog with auto-generated SKUs, native Excel (`.xlsx`) bulk import/export, and zero-lag pagination (`pagebutton`).
- **Key Mechanics**:
  1. **No Category & No Supplier Fields**: Simplify parts data by removing Category dropdowns and Supplier fields everywhere.
  2. **Automatic Real-Time SKU Barcode Generation**: Auto-generate SKU barcodes from the Part Name in real time (e.g. `PART-ENG-5W30-482`) as letters are typed, or on the fly if left blank during manual entry or Excel import.
  3. **Native Excel (.xlsx) Template & Bulk Import**:
     - **Export**: Provide a **Sample Excel (.xlsx)** download button generating a formatted template spreadsheet.
     - **Import**: Provide an **Import Excel** upload button using SheetJS `xlsx` to parse `.xlsx`, `.xls`, or `.csv` files into live stock.
  4. **Built-In Pagination System (pagebutton)**: Paginate inventory tables (10, 20, 50, 100 items per page) with navigation controls to eliminate browser lag on large stock catalogs.

