#!/usr/bin/python
#-*- coding: utf-8 -*-
# Author: Luca Salini
# Date: 10.2018
# Additional Info:

import json, xlrd

to_json = []
with xlrd.open_workbook(r'C:\Users\salin\switchdrive\Programmierprojekt_Arbeitsordner\Wandl_Russian.xlsx') as file:
    # sheet_names = file.sheet_names()
    # print('Sheet Names ', sheet_names)
    table = file.sheet_by_index(0)
    num_cols = table.ncols
    num_rows = table.nrows
    name_index = []

    for row_index in range(0, num_rows):
        content_dict = {}
        counter = 0
        # print(row_index)
        while counter < num_cols:
            cell_content = table.cell(row_index, counter).value

            if row_index == 0:
                if counter != 0:
                    name_index.append(cell_content)
            elif row_index == 1:
                break
            elif type(cell_content) == float and counter+1 != cell_content and counter > 0:
                break
            elif counter == 0:
                pass
            elif cell_content:
                content_dict['name'] = name_index[row_index-2]
                content_dict['date'] = row_index - 1
                content_dict[counter] = cell_content
            else:
                content_dict[counter] = None
            counter += 1
        if row_index != 0 and row_index != 1:
            to_json.append(content_dict)

print(to_json)


with open('new_definitions.json', 'w') as file:
    file.write(json.dumps(to_json))  # , indent=0))
