#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json, xlrd

to_json = []
with xlrd.open_workbook(r'C:\Users\salin\switchdrive\Programmierprojekt_Arbeitsordner\Wandl_Relationen + Beispiele.xlsx') as file:
    # sheet_names = file.sheet_names()
    # print('Sheet Names ', sheet_names)
    table = file.sheet_by_index(0)
    num_cols = table.ncols
    num_rows = table.nrows
    name_index = {}
    content_dict = {}
    ind = int
    type = ''
    start = 1
    changed = True
    example = ''

    for row_index in range(0, num_rows):
        counter = 0

        # print(row_index)
        while counter < num_cols:
            cell_content = table.cell(row_index, counter).value
            if counter == 0 and cell_content and row_index != 0:
                name_index[start] = content_dict
                start += 1
                content_dict = {}
                changed = True
            elif counter == 1 and cell_content:
                try:
                    ind = int(cell_content[-2:])
                except ValueError:
                    print(cell_content)
                    pass
            elif counter == 2 and cell_content:
                type = cell_content
                changed = True
            elif counter == 2 and not cell_content:
                changed = False
            elif counter == 3 and cell_content == 'fehlt':
                if changed:
                    example = type + ' von Wandel Nummer ' + str(start) + ': Kein Beispiel vorhanden.'
                else:
                    example = example + ' <br/> ' + type + ': Kein Beispiel vorhanden.'
                content_dict[ind] = example
            elif counter == 3 and cell_content:
                if changed:
                    example = type + ' von Wandel Nummer ' + str(start) + ': ' + cell_content
                else:
                    example = example + ' <br/> ' + type + ': ' + cell_content
                content_dict[ind] = example

            counter += 1

to_json.append(name_index)
print(name_index)


with open('examples.json', 'w') as file:
    file.write(json.dumps(to_json))  # , indent=0))