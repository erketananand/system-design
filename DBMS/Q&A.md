# SQL Queries Q&A

## Question 1: Find 2nd Highest Salary

**Problem:** Assume you are given the database of employees and their salaries. Write an SQL query to find the 2nd highest salary. Can you write the SQL query without using the window functions and LIMIT key?

### Solution 1: Without LIMIT and Window Functions

```sql
SELECT
    MAX(salary) AS second_highest_salary
FROM
    Employees
WHERE
    salary NOT IN (
        SELECT
            MAX(salary)
        FROM
            Employees
    );
```

### Solution 2: Using LIMIT with OFFSET

```sql
SELECT
    salary AS second_highest_salary
FROM
    Employees
ORDER BY
    salary DESC
LIMIT 1
OFFSET 1; -- (n-1)
```

---

## Question 2: Get All Active Users

**Problem:** Assume you have order data from a restaurant. Write an SQL query to get all active users.

**Definition of an Active User:**
- A returning active user is a user who has made a second purchase within 7 days of any of their previous purchases.
- The same user can place multiple purchases, but we only need to find those who meet the "second purchase within 7 days" rule.
- Return only distinct user_ids of active users.

### Solution

```sql
WITH UserPurchaseSequence AS (
    SELECT
        User_id,
        date AS current_purchase_date,
        LAG(date) OVER (PARTITION BY user_id ORDER BY date) AS previous_purchase_date
    FROM
        Orders
)
SELECT
    DISTINCT User_id
FROM
    UserPurchaseSequence
WHERE
    previous_purchase_date IS NOT NULL
    AND
    current_purchase_date <= previous_purchase_date + INTERVAL '7 DAY';
```

---

## Question 3: Interview Responses Analysis

**Problem Statement:** Given the Sample Table 'interview_responses'.

**Table Schema:**
- Respondent_id | name | age | gender | education | experience_years | salary_expectation

### Part 1: Average Salary Expectation

**Problem:** Write an SQL query to find the average salary expectation difference between male and female respondents with the same education level.

**Constraint:** You cannot use subqueries or CTEs.

```sql
SELECT
    Education,
    AVG(CASE WHEN gender = 'Male' THEN salary_expectation ELSE NULL END) - AVG(CASE WHEN gender = 'Female' THEN salary_expectation ELSE NULL END) AS avg_salary_expectation_difference
FROM
    Interview_responses
GROUP BY
    Education
HAVING
    COUNT(CASE WHEN gender = 'Male' THEN 1 ELSE NULL END) > 0
    AND
    COUNT(CASE WHEN gender = 'Female' THEN 1 ELSE NULL END) > 0
ORDER BY
    education; -- Added ORDER BY for consistent output
```

### Part 2: Highest Salary Expectation

**Problem:** Write an SQL query to find the respondent who has the highest salary expectation among those who have more experience years compared to the average experience years of all respondents.

```sql
SELECT
    Respondent_id,
    name,
    Salary_expectation,
    Experience_years
FROM
    Interview_responses
WHERE
    experience_years > (
        SELECT
            AVG(experience_years)
        FROM
            interview_responses
    )
ORDER BY
    salary_expectation DESC
LIMIT 1;
```

### Part 3: Most Experienced Respondent

**Problem:** Find the respondent with the most years of experience within each gender group, along with their salary and a prediction of their next year's salary expectation based on a 5% annual increase.

```sql
WITH RankedExperience AS (
    SELECT
        Respondent_id,
        name,
        Gender,
        Experience_years,
        Salary_expectation,
        RANK() OVER (PARTITION BY gender ORDER BY experience_years DESC, salary_expectation DESC) as rnk
    FROM
        Interview_responses
)
SELECT
    Respondent_id,
    Name,
    Gender,
    Experience_years,
    salary_expectation,
    (salary_expectation * 1.05) AS next_year_salary_prediction
FROM
    RankedExperience
WHERE
    rnk = 1
ORDER BY
    gender ASC,
    experience_years DESC;
```

---

## Question 4: Top 5 Cities with Most 5-Star Businesses

```sql
WITH city_5_stars_count AS (
    SELECT
        city,
        COUNT(*) AS num_5_star_businesses
    FROM
        business
    WHERE
        stars = 5.0
        AND
        is_open = 1
    GROUP BY
        city
)
SELECT
    city,
    num_5_star_businesses,
    RANK() OVER(ORDER BY num_5_star_businesses DESC) AS rank
FROM
    city_5_stars_count
WHERE
    rank <= 5;
```

---

## Question 5: Active Users

```sql
WITH curr_order_date_with_immediate_prev_order_date AS (
    SELECT
        user_id,
        date AS curr_date,
        LAG(date) OVER(PARTITION BY user_id ORDER BY date) AS prev_date
    FROM
        orders
)
SELECT
    DISTINCT user_id
FROM
    curr_order_date_with_immediate_prev_order_date
WHERE
    prev_date IS NOT NULL
    AND
    curr_date <= prev_date + INTERVAL '7 day';
```

---

## Question 6: Employee Salary Analysis by Region
<img width="975" height="827" alt="image" src="./images/employee ER diagram.jpg" />

**Part 1: Write an SQL query to find the minimum salary of an employee from each region.**

```sql
SELECT 
    r.region_name,
    MIN(e.salary) AS minimum_salary
FROM 
    employees e
    JOIN departments d ON e.department_id = d.department_id
    JOIN locations l ON d.location_id = l.location_id
    JOIN countries c ON l.country_id = c.country_id
    JOIN regions r ON c.region_id = r.region_id
GROUP BY 
    r.region_id, r.region_name
ORDER BY 
    r.region_name;
```

**Part 2: Write an SQL query to find the minimum salary of a manager from each region.**

```sql
SELECT 
    r.region_name,
    MIN(e.salary) AS minimum_manager_salary
FROM 
    employees e
    JOIN departments d ON e.department_id = d.department_id
    JOIN locations l ON d.location_id = l.location_id
    JOIN countries c ON l.country_id = c.country_id
    JOIN regions r ON c.region_id = r.region_id
WHERE 
    e.employee_id IN (SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL)
GROUP BY 
    r.region_id, r.region_name
ORDER BY 
    r.region_name;
```

**Part 3:  Write an SQL query to display the top 3 employees in each department who are getting more than the average salary of all the employees from each department.**

```sql
WITH DepartmentAverage AS (
    SELECT 
        department_id,
        AVG(salary) AS avg_salary
    FROM 
        employees
    GROUP BY 
        department_id
),
RankedEmployees AS (
    SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.salary,
        e.department_id,
        da.avg_salary,
        RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS salary_rank
    FROM 
        employees e
        JOIN DepartmentAverage da ON e.department_id = da.department_id
    WHERE 
        e.salary > da.avg_salary
)
SELECT 
    employee_id,
    first_name,
    last_name,
    salary,
    department_id,
    avg_salary AS department_avg_salary,
    salary_rank
FROM 
    RankedEmployees
WHERE 
    salary_rank <= 3
ORDER BY 
    department_id, salary_rank;
```

---

## Question 7: 