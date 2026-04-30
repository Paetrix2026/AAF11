
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 1029 to 1037 (0-indexed 1028 to 1036)
# 1029: </div> (closes 994)
# 1030: </div> (closes 917)
# 1031: extra?
# 1032: </ScrollArea>
# 1033: </motion.div>
# 1034: )}
# 1035: </AnimatePresence>
# 1036: </div> (closes 688)
# 1037: </div> (closes 350)

new_tail = [
    "                        </div>\n", # 1029
    "                      </div>\n",   # 1030
    "                    </ScrollArea>\n", # 1031
    "                  </motion.div>\n",   # 1032
    "                )}\n",                # 1033
    "              </AnimatePresence>\n",  # 1034
    "          </div>\n",                 # 1035
    "        </div>\n"                    # 1036
]

lines[1028:1037] = new_tail

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
