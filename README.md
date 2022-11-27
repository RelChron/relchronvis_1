# A Relative Chronology of Sound Changes in Russian
This web app visualizes a relative chronology of sound changes that have occurred in the Russian language from Proto-Slavic to the present day. It allows users to inspect individual changes and their relative datings and view examples. Try it out [here](https://relchron.eu.pythonanywhere.com).

## sound_changes.csv
Download the template for sound change data [here](https://relchron.eu.pythonanywhere.com/sc_template) (right-click > "Download Linked File").
You can modify this file with your own data. Below is a model of what it looks like when you open it in Excel (currently, you need Excel to modify the file). This would already be a valid file to pass into the web app.

|  | A | B | C | D |
|---|---|---|---|---|
| 1 |  | Name of SC 1 | Name of SC 2 | Name of SC 3 |
| 2 |  | Description of SC 1 | Description of SC 2 | Description of SC 3 |
| 3 |  | 1 | 2 | 3 |
| 4 | 1 |  | F | |
| 5 | 2 |  |  | B? |
| 6 | 3 |  |  | |

The first row and column in this table (A/B/C/D, 1/2/3/4/5/6) are only visible in Excel. This documentation uses this row and column to specify where to change things in the sheet.

Here's how to modify it with your own data:
 1. Open the file in MS Excel.
 2. Make sure you have as many columns after column A as you have sound changes.
 3. Make sure you have as many rows after row 3 as you have sound changes.
 4. Every column (starting from col B) is a sound change. For each one, Add a name (row 1) and a description (row 2). The description is optional.
 5. Make sure that row 3 enumerates all sound changes, starting at B3.
 6. Make sure that column A enumerates all sound changes, starting at A4.
 7. In the space below row 3 and after column A, you can add abbreviations that specify how the sound changes are related chronologically. For example, in the model table above, SC 2 comes after SC 1 because of Feeding (F). SC 3 comes after SC 2 because of Bleeding (B). You can add a `?` (like in D5) to specify that the relation is not confident. This is visualized as a dotted arc.
 8. **Do not enter anyything** into any other cells in the sheet, and do not enter any data in or below the "diagonal" of sound change relations. In the model table above, the diagonal consists of cells B4, C5, and D6.
 9. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 10. Replace the `sound_changes.csv` your `.csv` file.