# Relative Chronology Visualization
This web app visualizes relative chronology models. It allows users to inspect individual sound changes of a language and their relative datings and view examples. Try the web app [here](https://relchron.eu.pythonanywhere.com). Currently, the data comprises sound changes from the Croatian and Russian language, taken from REF1 and REF2. However, the data is easily customizable and does not necessarily have to be limited to linguistics.

## Terminology
| Term | Explanation |
| ---  | --- |
| Sound Change (SC) | Changes that a language has gone through. In the case of the Russian data, N = 71. Sound changes are dated relatively to each other, and each SC is represented by a filled circle in the arc diagram. Each SC has an ID, name and description. They are loaded from `sound_changes.csv`. |
| Relation | Relations between SCs, e.g. "3 before 8". Each SC has a set of relations to other SCs, which are represented by arcs in the arc diagram. Relations have a type and confidence. They are loaded from `sound_changes.csv`. |
| Relation type | An abbreviation describing the process by which a relation was established, e.g. "B", which stands for "Bleeding". These are also loaded from `sound_changes.csv` and show in the labels above arcs in the arc diagram. |
| Relation confidence | If a dating of a relation is uncertain, the corresponding arc will be displayed with a dotted line, and it can be filtered out. |
| Example | The example lexemes show up in a drawer element on the right side of the website after a SC has been selected. They are loaded from `examples.csv`, which contains data about each form of the lexeme after particular SCs. The website only displays examples that have undergone the selected SC. |

## sound_changes.csv
Download a template for SC data [here](https://relchron.eu.pythonanywhere.com/sc_template) (right-click > "Download Linked File" / "Save Link As...").
You can modify this file with your own data. Below is a model of what it looks like when you open it in Excel (currently, you need Excel to modify the file). This would already be a valid file to pass into the web app.

|   | A | B | C | D  |
|---|---|---|---|--- |
| 1 |   | Name of SC 1 | Name of SC 2 | Name of SC 3 |
| 2 |   | Description of SC 1 | Description of SC 2 | Description of SC 3 |
| 3 |   | 1 | 2 | 3  |
| 4 | 1 |   | F |    |
| 5 | 2 |   |   | B? |
| 6 | 3 |   |   |    |

The first row and column in this table (A/B/C/D, 1/2/3/4/5/6) are only visible in Excel and give the identity of a cell.

Layout
 - Make sure you have as many columns after column A as you have SCs.
 - Make sure you have as many rows after row 3 as you have SCs.
 - Every column (starting from col B) is an SC. For each one, Add a name (row 1) and a description (row 2). The description is optional.
 - Make sure that row 3 enumerates all SCs, starting at B3.
 - Make sure that column A enumerates all SCs, starting at A4.
 - In the space below row 3 and after column A, you can add abbreviations that specify how the SCs are related chronologically. For example, in the model table above, SC 2 comes after SC 1 because of Feeding (F). SC 3 comes after SC 2 because of Bleeding (B). You can add a `?` (like in D5) to specify that the relation is not confident.
 - **Do not enter anything** into any other cells in the sheet, and do not enter any data in or below the "diagonal" of SC relations. In the model table above, the diagonal consists of cells B4, C5, and D6.

Here's how to modify the file with your own data:
 1. Open it in MS Excel.
 2. Fill the sheet with your own sound changes and relations, following the layout above.
 3. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 4. Replace the `sound_changes.csv` with your `.csv` file.

## examples.csv
Download a template for example data [here](https://relchron.eu.pythonanywhere.com/ex_template) (right-click > "Download Linked File" / "Save Link As...").
Again, you can modify this file with your own data. Below is a model of what it looks like when you open it in Excel (currently, you need Excel to modify the file). This would already be a valid file to pass into the web app.

The first row and column in this table (A/B/C/D, 1/2/3/4/5/6) are only visible in Excel and give the identity of a cell.

|   | A | B | C | D |
|---|---|---|---|---|
| 1 | Ru. | PSl. | 1 | 2 |
| 2 | Last form of example 1 | First form of example 1 | Example 1 after SC 1 | Example 1 after SC 2 |
| 3 | Last form of example 2 | First form of example 2 | Example 2 after SC 1 | Example 2 after SC 2 |
| 4 | Last form of example 3 | First form of example 3 | Example 3 after SC 1 | Example 3 after SC 2 |
| 5 | Last form of example 4 | First form of example 4 | Example 4 after SC 1 | Example 4 after SC 2 |
| 6 | Last form of example 5 | First form of example 5 | Example 5 after SC 1 | Example 5 after SC 2 |

Layout
 - Each row after row 1 contains all the forms for one example lexeme.
 - Column A is the most recent form of each example. In this case, it's present-day Russian ("Ru." for short).
 - Column B is the earliest form of each example. In this case, that is proto-slavic ("PSl." for short).
 - Each column after B is numbered with a SC ID in row 1.
 - If the lexeme changes after a SC, it appears in the cell under that SC.

Here's how to modify the file with your own data:
 1. Open it with MS Excel.
 2. Fill the rows with your own lexemes and forms.
 3. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 4. Replace the `examples.csv` with your `.csv` file.

Note that the web app will extract abbreviations for the earliest and last form from this file (from A1 and B1), and will insert them in the example chronology below the arc diagram.

## relations.csv
Download a template for example data [here](https://relchron.eu.pythonanywhere.com/rel_template) (right-click > "Download Linked File" / "Save Link As...").
You can modify this file with your own data. Below is a model of what it looks like when you open it in Excel (currently, you need Excel to modify the file). This would already be a valid file to pass into the web app.

|   | A | B | C | D |
|---|---|---|---|---|
| 1 | source_id | target_id | description |
| 2 | 1 | 2 | Reason why SC 1 is dated before SC 2 |
| 3 | 1 | 2 | Another reason why SC 1 is dated before SC 2 |
| 4 | 1 | 9 | Reason why SC 1 is dated before SC 9 |
| 5 | 3 | 7 | Reason why SC 3 is dated before SC 7 |

Layout
 - Each row contains one reason for a particular dating.
 - Do not change anything in row 1.
 - Columns A and B contain the IDs of the SCs which are dated in relation to each other. The earlier SC always goes into column A.
 - Column C contains the reason for this dating. Usually consists of a single sentence.
 - As in row 2 and 3, it's possible that there are multiple or alternative reasons.

Here's how to modify the file with your own data:
 1. Open it with MS Excel.
 2. Fill the rows with your own relations and descriptions.
 3. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 4. Replace the `relations.csv` with your `.csv` file.

