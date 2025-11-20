from app.db.session import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('students')
household_col = [c for c in columns if c['name'] == 'household']
print('Household column exists:', len(household_col) > 0)
if household_col:
    print('Column details:', household_col[0])
else:
    print('Available columns:', [c['name'] for c in columns])
