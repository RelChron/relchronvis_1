#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json, xlrd

to_json = []
with xlrd.open_workbook(r'C:\Users\salin\switchdrive\Programmierprojekt_Arbeitsordner\Wandl_Russian_examples.xlsx') as file:
    # sheet_names = file.sheet_names()
    # print('Sheet Names ', sheet_names)
    table = file.sheet_by_index(0)
    num_cols = table.ncols
    num_rows = table.nrows
    name_index = {}
    content_dict = {}
    name = ''

    for row_index in range(0, num_rows):
        counter = 0

        # print(row_index)
        while counter < num_cols:
            cell_content = table.cell(row_index, counter).value
            if row_index == 0:
                break
            elif counter == 0 and cell_content and row_index > 0:
                if row_index == 1:
                    name = cell_content
                else:
                    content_dict[name] = name_index
                    name_index = {}
                    name = cell_content
            elif counter == 1 and cell_content:
                name_index["ursl"] = cell_content
            elif counter < 73 and not cell_content:
                name_index[counter - 1] = None
            elif counter < 73 and cell_content:
                name_index[counter - 1] = cell_content
            elif counter == 73 and cell_content:
                name_index['rus'] = cell_content
            elif counter == 73 and not cell_content:
                name_index['rus'] = None
            elif counter == 74 and cell_content:
                name_index['vgl'] = cell_content
            elif counter == 74 and not cell_content:
                name_index['vgl'] = None
            elif counter == 75 and cell_content:
                name_index['lw'] = cell_content
            elif counter == 75 and not cell_content:
                name_index['lw'] = None
            else:
                print(row_index, counter, cell_content, '='*30)

            counter += 1

to_json.append(content_dict)
print(to_json)


with open('right_examples.json', 'w') as file:
    file.write(json.dumps(to_json))  # , indent=0))