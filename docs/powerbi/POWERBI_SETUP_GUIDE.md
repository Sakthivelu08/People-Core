# Power BI People Analytics Setup Guide for People-Core

This guide documents the data architecture, DAX measures, and setup steps to connect Power BI Desktop to your **People-Core** dataset.

---

## 1. Relational Data Model & Schema Relationships

Import the four CSV files from `docs/powerbi/data/`:
1. `employees.csv` (Primary Key: `id`)
2. `leave_requests.csv` (Foreign Key: `employee_id` -> `employees.id`)
3. `onboarding_tasks.csv` (Foreign Key: `employee_id` -> `employees.id`)
4. `attrition_analytics.csv` (Foreign Key: `employee_id` -> `employees.id`)

### Relationships (1-to-Many):
- `employees[id]` (1) ---> (Many) `leave_requests[employee_id]`
- `employees[id]` (1) ---> (Many) `onboarding_tasks[employee_id]`
- `employees[id]` (1) ---> (1) `attrition_analytics[employee_id]`

---

## 2. Calculated DAX Measures

Add the following DAX measures in Power BI Desktop under Modeling > New Measure:

### Total Employees Count
```dax
Total Employees = COUNTROWS(employees)
```

### High Flight Risk Count
```dax
High Risk Employees = CALCULATE(COUNTROWS(attrition_analytics), attrition_analytics[risk_level] = "high")
```

### Attrition Risk Rate (%)
```dax
Attrition Risk Rate % = DIVIDE([High Risk Employees], [Total Employees], 0) * 100
```

### Average Days On Leave
```dax
Avg Leave Days = AVERAGE(leave_requests[days])
```

### Onboarding Completion Rate (%)
```dax
Onboarding Completion % = 
VAR TotalTasks = COUNTROWS(onboarding_tasks)
VAR CompletedTasks = CALCULATE(COUNTROWS(onboarding_tasks), onboarding_tasks[completed] = 1)
RETURN DIVIDE(CompletedTasks, TotalTasks, 0) * 100
```

---

## 3. Power BI Visualizations Included

1. **KPI Scorecard Cards**:
   - Total Headcount
   - High Flight Risk Count
   - Average Leave Days
   - Onboarding Progress %
2. **Departmental Attrition Risk Breakdown**:
   - Stacked Bar Chart mapping `employees[department]` vs `attrition_analytics[risk_level]`.
3. **Leave Utilization by Type**:
   - Donut Chart mapping `leave_requests[type]` (`annual`, `sick`, `casual`) vs `leave_requests[days]`.
4. **Onboarding Status Grid**:
   - Matrix Table showing Employee Name, Department, Onboarding Task Category, and Task Completion Status.

---

## 4. Automated Data Refresh Command

To refresh the CSV files directly from TiDB MySQL:
```bash
npm run export-powerbi --prefix server
```
