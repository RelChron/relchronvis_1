#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from openpyxl import Workbook
from openpyxl.utils.cell import coordinate_from_string, column_index_from_string
# this script generates a template in Excel to fill in explanations for the different relations between the wandels.
# it is neither beautiful nor efficient, just practical.


def get_data() -> (int, int, str):
    """returns current relation of wandels"""
    with open('../data/data.json', 'r') as jsonfile:
        data = json.loads(jsonfile.readline())
        for wandel in data:
            for relation in wandel:
                if type(wandel[relation]) == str and not wandel[relation].startswith('Linguistik:'):
                    yield int(wandel['date']), int(relation) - 1, wandel[relation]


def generate() -> bool:
    """generates the template"""
    # create Excel sheet
    wb = Workbook()
    ws = wb.active
    ws.title = 'Begründungen'
    old_relation = ()

    # iterate and fill sheet
    for row, relation in zip(ws.iter_rows(min_row=1, max_col=4, max_row=200), get_data()):
        for cell in row:
            # get coordinates of cell
            xy = coordinate_from_string(cell.coordinate)
            col = column_index_from_string(xy[0])
            rw = xy[1]

            if rw == 1 and col == 1:
                cell.value = 'Wandel Nummer [1]'
            elif rw == 1 and col == 2:
                cell.value = 'Wandel Nummer [2]'
            elif rw == 1 and col == 3:
                cell.value = 'Relationstyp'
            elif rw == 1 and col == 4:
                cell.value = 'Begründung'
            elif rw > 1:
                if col == 1:
                    cell.value = old_relation[0]
                elif col == 2:
                    cell.value = old_relation[1]
                elif col == 3:
                    cell.value = old_relation[2]
            else:
                raise IndexError('something went wrong, check your code')
        # because of header first relation gets skipped, that's why this var is here
        old_relation = relation
    wb.save('../data/template-for-explanations.xlsx')
    return True


def main():
    generate()


if __name__ == '__main__':
    main()

