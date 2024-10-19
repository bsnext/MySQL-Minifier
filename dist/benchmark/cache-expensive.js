"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const Benchmark = require("benchmark");
const bench = new Benchmark.Suite();
const queryExpensive = `
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
`;
const queryMedium = `
    SET @\`row_number\` = 0;

    SELECT 
        E.name,
        D.name AS department,
        P.title AS project,
        AVG(T.hours) AS average_hours,
        SUM(CASE WHEN T.date BETWEEN '2023-01-01' AND '2023-06-30' THEN T.hours ELSE 0 END) AS total_hours_first_half,
        @\`row_number\` := @\`row_number\` + 1 AS \`row_number\`,
        (SELECT COUNT(*) FROM tasks WHERE employee_id = E.id) AS total_tasks,
        (SELECT MAX(budget) FROM projects WHERE manager_id = E.id) AS max_project_budget
    FROM 
        employees E
    JOIN 
        department_employees DE ON E.id = DE.employee_id
    JOIN 
        departments D ON DE.department_id = D.id
    LEFT JOIN 
        project_assignments PA ON E.id = PA.employee_id
    LEFT JOIN 
        projects P ON PA.project_id = P.id
    LEFT JOIN 
        tasks T ON E.id = T.employee_id
    WHERE 
        E.salary > (SELECT AVG(salary) FROM employees)
    GROUP BY 
        E.name, D.name, P.title
    HAVING 
        AVG(T.hours) > 8
    ORDER BY 
        total_hours_first_half DESC, max_project_budget DESC
    LIMIT 10;
`;
const queryCheap = `
    SELECT
        orders.id,
        customers.name AS customer,
        (SELECT SUM(order_items.quantity * products.price)
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_items.order_id = orders.id) AS total_order_value,
        CASE
            WHEN orders.status = 'shipped' THEN 'Completed'
            ELSE 'In Progress'
        END AS order_status
    FROM orders
    JOIN customers ON orders.customer_id = customers.id;
`;
const minifier_1 = new __1.default(true);
bench.add(`[Cache] Minify Very-Expensive`, function () {
    minifier_1.minify(queryExpensive);
});
bench.on('cycle', function (e) {
    console.log(e.target.toString());
});
bench.run();
//# sourceMappingURL=cache-expensive.js.map