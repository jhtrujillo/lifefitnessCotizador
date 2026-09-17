import os
import re

# Database of standard specs (L*W*H mm, Stack kg, NW kg, GW kg, Vol)
specs_db = {
    'MATRIX-VERSA-BICEPS': ('1220*1040*1670', '72', '226', '246', '1.2'),
    'MATRIX-VERSA-CHEST': ('1340*1410*1670', '104', '247', '267', '1.5'),
    'MATRIX-VERSA-LATPULL': ('1460*1210*1980', '104', '255', '275', '1.6'),
    'MATRIX-VERSA-ABDOMINAL': ('1390*940*1670', '72', '201', '221', '1.3'),
    'MATRIX-VERSA-SHOULDER': ('1500*1430*1670', '90', '241', '261', '1.4'),
    'MATRIX-VERSA-TRICEPS': ('1570*1070*1670', '90', '252', '272', '1.4'),
    'MATRIX-VERSA-LEGEXT': ('1830*1080*1670', '104', '250', '270', '1.6'),
    'MATRIX-VERSA-LEGPRESS': ('2140*1130*1670', '188', '367', '387', '2.2'),
    'FREEMOTION-F703': ('1820*1060*1850', '90', '285', '305', '1.8'),
    'FREEMOTION-GZFM6019': ('1370*1210*1850', '77', '220', '240', '1.5'),
    'FREEMOTION-GZFM6003': ('1520*1010*1850', '77', '230', '250', '1.5'),
    'FREEMOTION-GZFM6012': ('1770*1010*1850', '90', '245', '265', '1.6'),
    'FREEMOTION-GZFM6018': ('1540*1210*1850', '77', '235', '255', '1.5'),
    'FULLROM-DAP': ('1550*1100*2300', '160', '350', '380', '2.5'),
    'FULLROM-LINEAR-LEG-PRESS': ('2400*1600*1500', '', '250', '280', '2.1'),
    'FULLROM-V-SQUAT': ('2200*1100*1800', '', '210', '240', '1.8'),
    'FULLROM-SISSY-SQUAT': ('1050*650*550', '', '45', '55', '0.5'),
    'RG5005': ('1600*1200*900', '', '120', '140', '1.1'),
    'RG1039': ('1300*650*450', '', '35', '45', '0.4'),
    'RG5003': ('1800*1400*1100', '', '150', '170', '1.5'),
    'RE8014': ('1394*1080*1600', '100', '220', '240', '1.5'),
    'RE8015': ('1641*1204*1600', '100', '230', '250', '1.5'),
    'CYBEX-VR3-SEATED-LEG-CURL': ('1650*1050*1620', '111', '265', '285', '1.6')
}

sql_file = 'nuevos_productos/productos_nuevos.sql'
with open(sql_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    updated = False
    for item_no, specs in specs_db.items():
        if f"'{item_no}'" in line:
            # Reemplazar los campos vacíos '', '', '', '', '' con los de specs_db
            # Formato original en el insert: '', '', '', '', '', 'uploads...
            old_empty = "'', '', '', '', '',"
            new_vals = f"'{specs[0]}', '{specs[1]}', '{specs[2]}', '{specs[3]}', '{specs[4]}',"
            if old_empty in line:
                line = line.replace(old_empty, new_vals)
                updated = True
                break
    new_lines.append(line)

with open(sql_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("SQL specs updated successfully!")
