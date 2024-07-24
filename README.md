# Relative Chronology Visualization
This web app visualizes relative chronology models. It allows users to inspect individual sound changes of a language and their relative datings and view examples. Try the web app [here](https://relchron.eu.pythonanywhere.com). Currently, the data comprises sound changes from the Croatian and Russian language, taken from Holzer (2007) and Wandl (2011). However, the data is easily customizable and does not necessarily have to be limited to linguistics. The rest of this document explains how to format your custom data and how to upload it to the web app.

## How to cite
If you use this paper please cite
 - the article introducing the application
> Wandl, Florian, Thelitz, Thilo H. K. 2024. RelChronVis: an interactive web application for visualizing the relative chronology of language changes. _International Journal of Digital Humanities_. https://doi.org/10.1007/s42803-024-00086-1
 - the resources for the included data
> Holzer, Georg. 2007. _Historische Grammatik des Kroatischen. Einleitung und Lautgeschichte der Standardsprache_. Schriften über Sprachen und Texte; 9. Frankfurt am Main et al.: Peter Lang.

> Wandl, Florian. 2011. _Diachrone Lautlehre des Russischen. Ein Modell des Lautwandels und seiner relativen Chronologie_. MA thesis, University of Vienna.


## Terminology
| Term | Explanation |
| ---  | --- |
| Sound Change (SC) | Changes that a language has gone through. In the case of the Russian data, N = 71. Sound changes are dated relatively to each other, and each SC is represented by a filled circle in the arc diagram. Each SC has an ID, name and description. They are loaded from `sound_changes.csv`. |
| Relation | Relations between SCs, e.g. "3 before 8". Each SC has a set of relations to other SCs, which are represented by arcs in the arc diagram. Apart from their associated two sound changes, relations have a type, confidence and description. They are loaded from `relations.csv`. |
| Relation type | An abbreviation describing the process by which a relation was established, e.g. "B", which stands for "Bleeding". These are loaded from `relations.csv` and determinde the color of an arc or ribbon. |
| Relation confidence | If a dating of a relation is uncertain, in the arc diagram, the corresponding arc will be displayed with a dotted line, and it can be filtered out. |
| Example | The example lexemes show up in a drawer element on the right side of the app after a SC has been selected. They are loaded from `examples.csv`, which contains data about each form of the lexeme after particular SCs. The website only displays examples that have undergone the selected SC. |

## General Disclaimers
We recommend Microsoft Excel for editing the data, because the web app expects this "dialect" of csv file. Feel free to try regular csv files. While everything should work, there may be unexpected results or errors.

The table examples include the reference row (A/B/C/D/...) and column (1/2/3/4/...) that are only visible in Excel and aren't actually part of the csv file.

## sound_changes.csv
Download a template for SC data [here](https://relchron.eu.pythonanywhere.com/sc_template) (right-click > "Download Linked File" / "Save Link As...").
You can modify this file with your own data. Below is a model of what it looks like when you open it in Excel. This would already be a valid file to pass into the web app.

|   | A | B | C |
|---|---|---|---|
| 1 | id | name | description |
| 2 | 1 | Name of SC 1 | Description of SC 1 |
| 3 | 2 | Name of SC 2 | Description of SC 2 |
| 4 | 3 | Name of SC 3 | Description of SC 3 |
| 5 | 4 | Name of SC 4 | Description of SC 4 |

Layout
 - Every row is an SC. For each one, Add an id, a name (col B) and a description (col C). The description is optional.
 - **Do not change anything** in row 1.
 - **Do not enter anything** into any other columns in the sheet after D.

Here's how to modify the file with your own data:
 1. Open it in MS Excel.
 2. Fill the sheet with your own SCs, following the layout above.
 3. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 4. Replace the `sound_changes.csv` with your `.csv` file.


## relations.csv
Download a template for example data [here](https://relchron.eu.pythonanywhere.com/rel_template) (right-click > "Download Linked File" / "Save Link As...").
You can modify this file with your own data. Below is a model of what it looks like when you open it in Excel. This would already be a valid file to pass into the web app.

|   | A | B | C | D | E |
|---|---|---|---|---|---|
| 1 | source | target | type | confident | description |
| 2 | 1 | 2 | F | TRUE | Reason why SC 1 is dated before SC 2 |
| 3 | 1 | 2 | CF | TRUE | Another reason why SC 1 is dated before SC 2 |
| 4 | 1 | 9 | F | TRUE | Reason why SC 1 is dated before SC 9 |
| 5 | 2 | 9 | F | FALSE | Reason why SC 2 is dated before SC 9 |

Layout
 - Each row contains one reason for a particular dating.
 - Columns A and B contain the IDs of the SCs which are dated in relation to each other. The earlier SC always goes into column A.
 - Column C contains the relation type. This is one of a few predetermined abbreviations (see below). The abbreviation determines the coloring in the diagram, and which text is displayed as additional information.
 - Column D contains the confidence about the dating. It can be set to TRUE or FALSE. The latter will make the arc diagram display that relation arc as a dashed line, and will enable the user to filter this relation out with the appropriate filter. Row 5 contains an unconfident relation.
 - Column E contains the reason for the dating. Usually consists of a single sentence.
 - As in row 2 and 3, it's possible that there are multiple or alternative relation types for the same two sound changes.
 - **Do not change anything** in row 1.
 - **Do not enter anything** into any other columns in the sheet.

Here's how to modify the file with your own data:
 1. Open it with MS Excel.
 2. Fill the rows with your own relations and descriptions.
 3. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 4. Replace the `relations.csv` with your `.csv` file.

Possible relation types:
 - F (Feeding)
 - CF (Counterfeeding)
 - B (Bleeding)
 - CB (Counterbleeding)
 - LW (Loanword)
 - A (Attestation)
 - N (Naturalness)
 - P (Plausibility)
 - S (Simplicity)


## examples.csv
Download a template for example data [here](https://relchron.eu.pythonanywhere.com/ex_template) (right-click > "Download Linked File" / "Save Link As...").
Again, you can modify this file with your own data. Below is a model of what it looks like when you open it in Excel. This would already be a valid file to pass into the web app.

|   | A | B | C | D | E |
|---|---|---|---|---|---|
| 1 | Ru. | Phonetic | PSl. | 1 | 2 |
| 2 | Last form of example 1 | Phonetic transcription | First form of example 1 | Example 1 after SC 1 | Example 1 after SC 2 |
| 3 | Last form of example 2 | Phonetic transcription | First form of example 2 | Example 2 after SC 1 | Example 2 after SC 2 |
| 4 | Last form of example 3 | Phonetic transcription | First form of example 3 | Example 3 after SC 1 | Example 3 after SC 2 |
| 5 | Last form of example 4 | Phonetic transcription | First form of example 4 | Example 4 after SC 1 | Example 4 after SC 2 |
| 6 | Last form of example 5 | Phonetic transcription | First form of example 5 | Example 5 after SC 1 | Example 5 after SC 2 |

Layout
 - Each row after row 1 contains all the forms for one example lexeme.
 - Column A is the most recent form of each example. In this case, it's present-day Russian ("Ru." for short).
 - Column B is a phonetic transcription of column A.
 - Column C is the earliest form of each example. In this case, that is proto-slavic ("PSl." for short).
 - Each column after B is numbered with a SC ID in row 1.
 - If the lexeme changes after a SC, it appears in the cell under that SC.
 - **Do not change anything** in row 1.


Here's how to modify the file with your own data:
 1. Open it with MS Excel.
 2. Fill the rows with your own lexemes and forms.
 3. Save the file as "CSV UTF-8 (Comma-delimited) (.csv)".
 4. Replace the `examples.csv` with your `.csv` file.

Note that the web app will extract abbreviations for the earliest and last form from this file (from A1 and B1), and will insert them in the example chronology below the diagrams.


## Upload
After you have created your own custom  `.csv` files, you can upload them at https://relchron.eu.pythonanywhere.com/upload. Make sure to attach each file to the correct button and press the blue button at the bottom of the page. The web app should now show the arc diagram with your custom data and full functionality. You can switch to the chord diagram to see your custom data as well. The data will persist within the same browser even if you close it, and you should still see your custom data when visiting https://relchron.eu.pythonanywhere.com/arc_diagram?lang=custom or https://relchron.eu.pythonanywhere.com/chord_diagram?lang=custom again later. If you want to change the custom data, simply go to https://relchron.eu.pythonanywhere.com/upload again.


## References
 - Holzer, Georg (2007). Historische Grammatik des Kroatischen. Einleitung und Lautgeschichte der Standardsprache. Schriften über Sprachen und Texte; 9. Frankfurt am Main et al.: Peter Lang.
 - Wandl, Florian (2011). Diachrone Lautlehre des Russischen. Ein Modell des Lautwandels und seiner relativen Chronologie.
