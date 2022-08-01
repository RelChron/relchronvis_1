#!/usr/bin/python
#-*- coding: utf-8 -*-
# Author: Luca Salini
# Date: 10.2018
# Additional Info:

import csv, json, xlrd

to_json = []
with xlrd.open_workbook(r'C:\Users\salin\switchdrive\Programmierprojekt_Arbeitsordner\Wandl_Wandel-Beschreibungen-Beispiele-LW.xlsx') as file:
    # sheet_names = file.sheet_names()
    # print('Sheet Names ', sheet_names)
    table = file.sheet_by_index(0)
    num_cols = table.ncols
    num_rows = table.nrows
    name_index = []


    for row_index in range(0, num_rows):
        content_dict = {}
        counter = 0
        print(row_index)

        cell_content = table.cell(row_index, 2).value
        index = table.cell(row_index, 1).value

        content_dict["name"] = cell_content

        if row_index != 0:
            to_json.append(content_dict)
print(to_json)


with open('definitions.json', 'w') as file:
    file.write(json.dumps(to_json))  # , indent=0))
