# MySQL-Minifier

Small library for compress queries, for decrease data-size transfered in network.

## Installing:
```bash
npm install @bsnext/mysql-minifier
```

```ts
import MySQLMinifier from "@bsnext/mysql-minifier";
const minifier = new MySQLMinifier(true);
const result = minifier.minify(`HERE A YOUR MYSQL QUERY`);
```

## Usage:
```ts
new MySQLMinifier(isCaching: boolean = false, cacheLimit: number = 100, cachePurgeTime?: number)
```

* isCaching - State of LRU cache mode for store parsed keys.
* cacheLimit - Limit of max LRU cache size.
* cachePurgeTime - Interval (seconds) for purge cache. Disabled by default.

## Example:
<b>2884 characters.</b>
```sql
SET @running_total := 0, @previous_salary := 0; -- Initialize variables for running total and previous salary

SELECT 
    E.id, -- Select employee ID
    E.name, -- Employee name
    CONCAT(E.first_name, ' ', E.last_name) AS full_name, # Concatenate first and last name for full name
    D.name AS department, -- Department name
    P.title AS project, -- Project title
    T.task_description, # Task description
    AVG(T.hours) AS average_hours, -- Calculate average hours worked on tasks
    SUM(T.hours) OVER (PARTITION BY E.id ORDER BY T.date) AS cumulative_hours, # Cumulative hours worked by each employee
    @running_total := @running_total + E.salary AS running_total_salary, -- Calculate running total of salaries
    CASE 
        WHEN @previous_salary < E.salary THEN 'Increased'
        ELSE 'Decreased'
    END AS salary_trend, -- Trend of salary compared to previous
    @previous_salary := E.salary, # Update previous salary to current salary
    (SELECT GROUP_CONCAT(task_name SEPARATOR ', ') FROM tasks WHERE employee_id = E.id) AS all_tasks, -- Concatenate all task names for each employee
    (SELECT MAX(budget) FROM projects WHERE manager_id = E.id) AS max_project_budget, -- Maximum project budget managed by the employee
    (SELECT MIN(start_date) FROM projects WHERE department_id = D.id) AS department_earliest_project, # Earliest project start date in the department
    (SELECT COUNT(*) FROM department_employees WHERE department_id = D.id) AS department_size, -- Size of the department
    (SELECT AVG(salary) FROM employees WHERE department_id = D.id) AS department_avg_salary, -- Average salary in the department
    (SELECT SUM(hours) FROM tasks WHERE employee_id = E.id AND date BETWEEN '2023-01-01' AND '2023-06-30') AS total_hours_first_half -- Total hours worked in the first half of 2023
FROM 
    employees E -- From employees table
JOIN 
    department_employees DE ON E.id = DE.employee_id -- Join with department_employees
JOIN 
    departments D ON DE.department_id = D.id -- Join with departments
LEFT JOIN 
    project_assignments PA ON E.id = PA.employee_id -- Left join with project_assignments
LEFT JOIN 
    projects P ON PA.project_id = P.id -- Left join with projects
LEFT JOIN 
    tasks T ON E.id = T.employee_id -- Left join with tasks
WHERE 
    E.salary > (SELECT AVG(salary) FROM employees WHERE department_id = D.id) -- Filter for salaries above department average
    AND E.start_date < '2023-01-01' -- Filter for employees who started before 2023
    AND EXISTS (SELECT 1 FROM projects WHERE manager_id = E.id) -- Filter for employees who manage at least one project
GROUP BY 
    E.id, E.name, D.name, P.title, T.task_description -- Group by various fields for aggregation
ORDER BY 
    cumulative_hours DESC, max_project_budget DESC, department_avg_salary -- Order by several criteria
LIMIT 10; # Limit to top 10 results
```

## Result:
<b>1550 characters.</b>
```sql
SET@running_total:=0,@previous_salary:=0;SELECT E.id,E.name,CONCAT(E.first_name,' ',E.last_name)AS full_name,D.name AS department,P.title AS project,T.task_description,AVG(T.hours)AS average_hours,SUM(T.hours)OVER(PARTITION BY E.id ORDER BY T.date)AS cumulative_hours,@running_total:=@running_total+E.salary AS running_total_salary,CASE WHEN@previous_salary<E.salary THEN'Increased'ELSE'Decreased'END AS salary_trend,@previous_salary:=E.salary,(SELECT GROUP_CONCAT(task_name SEPARATOR', ')FROM tasks WHERE employee_id=E.id)AS all_tasks,(SELECT MAX(budget)FROM projects WHERE manager_id=E.id)AS max_project_budget,(SELECT MIN(start_date)FROM projects WHERE department_id=D.id)AS department_earliest_project,(SELECT COUNT(*)FROM department_employees WHERE department_id=D.id)AS department_size,(SELECT AVG(salary)FROM employees WHERE department_id=D.id)AS department_avg_salary,(SELECT SUM(hours)FROM tasks WHERE employee_id=E.id AND date BETWEEN'2023-01-01'AND'2023-06-30')AS total_hours_first_half FROM employees E JOIN department_employees DE ON E.id=DE.employee_id JOIN departments D ON DE.department_id=D.id LEFT JOIN project_assignments PA ON E.id=PA.employee_id LEFT JOIN projects P ON PA.project_id=P.id LEFT JOIN tasks T ON E.id=T.employee_id WHERE E.salary>(SELECT AVG(salary)FROM employees WHERE department_id=D.id)AND E.start_date<'2023-01-01'AND EXISTS(SELECT 1 FROM projects WHERE manager_id=E.id)GROUP BY E.id,E.name,D.name,P.title,T.task_description ORDER BY cumulative_hours DESC,max_project_budget DESC,department_avg_salary LIMIT 10;
```

## Benchmark:
[Used code for test and get those results.](https://github.com/bsnext/MySQL-Minifier/blob/main/src/benchmark)
```js
[No Cache] Minify Very-Expensive x 21,620 ops/sec ±0.50% (95 runs sampled)
[No Cache] Minify Medium SQL Query x 41,684 ops/sec ±0.73% (94 runs sampled)
[No Cache] Minify Cheap SQL Query x 91,676 ops/sec ±0.37% (93 runs sampled)
[Cache] Minify Very-Expensive x 125,527,995 ops/sec ±3.23% (83 runs sampled)
[Cache] Minify Medium SQL Query x 125,468,551 ops/sec ±3.82% (84 runs sampled)
[Cache] Minify Cheap SQL Query x 122,797,325 ops/sec ±3.46% (82 runs sampled)

// Node v22.8.0, Win 11, Ryzen 7 3800X 3.89 GHz, 32 GB RAM 3200 MHz
```
