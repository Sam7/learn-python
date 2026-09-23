# Learn Programming with Python

## Curriculum & Learning Design Specification

## 1. Product goal

This course should teach a complete beginner to **think like a programmer**.

Python is the medium, not the subject.

At the end of the core curriculum, a learner should be able to take a small unfamiliar problem and independently:

1. understand what is being asked;
2. identify the inputs, outputs, rules, and state;
3. break the problem into smaller pieces;
4. choose appropriate representations for the data;
5. describe an algorithm;
6. implement it;
7. trace the program mentally;
8. test it;
9. debug it systematically;
10. improve its structure without changing its behaviour.

The success criterion is therefore **not**:

> “The learner knows Python syntax.”

It is:

> “The learner can reason about computation and build working programs.”

This matches the direction of the 2026 CSTA standards, which explicitly give greater weight to algorithms and computational thinking and broaden programming beyond writing code to include reading, evaluating, modifying, debugging, testing, and refining programs.

---

# 2. The pedagogical model

The entire product should revolve around one repeatable learning cycle.

## Predict → Run → Inspect → Explain → Modify → Debug → Make

It is essentially an expanded version of PRIMM — Predict, Run, Investigate, Modify, Make — combined with Use–Modify–Create, tracing, worked examples, retrieval practice, and explicit debugging instruction. PRIMM deliberately begins with **reading working programs before asking beginners to write them**, then gradually transfers ownership to the learner.

The stages should mean:

| Stage       | Learner behaviour                                                       |
| ----------- | ----------------------------------------------------------------------- |
| **Predict** | “What do I think this program will do?”                                 |
| **Run**     | Execute it and compare reality with the prediction.                     |
| **Inspect** | Look at variables, control flow, output, and intermediate state.        |
| **Explain** | Describe *why* it behaved that way.                                     |
| **Modify**  | Change one meaningful part of an existing working program.              |
| **Debug**   | Diagnose a deliberately broken variation.                               |
| **Make**    | Solve a closely related problem without being given the implementation. |

Not every lesson needs all seven stages. But every **concept arc** should progress through them.

This is important because asking a novice to create a whole program immediately creates a very large search space. Worked examples and subgoal-labelled examples reduce that cognitive burden, and research in introductory programming found that subgoal-labelled instruction improved initial problem-solving performance and reduced the proportion of learners who failed or withdrew.

---

# 3. The gradual removal of scaffolding

The learner should experience this progression across the course:

```text
Run this
    ↓
Predict this
    ↓
Trace this
    ↓
Explain this
    ↓
Change one thing
    ↓
Fill one gap
    ↓
Reorder these lines
    ↓
Fix this bug
    ↓
Complete this program
    ↓
Write this small part
    ↓
Solve this problem
    ↓
Break this problem apart
    ↓
Design the solution yourself
```

That progression is more important than the individual Python features.

Parsons problems — giving learners the necessary code fragments and asking them to arrange them — are particularly useful in the middle of this continuum. A 2024 study with sixth-grade learners found that Parsons-problem scaffolding improved grades and learning efficiency compared with asking learners to construct the same programs without that scaffold.

---

# 4. The lesson should feel like an experiment, not a textbook

Avoid:

> “A variable is a named storage location. Here is the syntax…”

Prefer:

### What happens?

```python
score = 10
print(score)

score = 20
print(score)
```

Ask for a prediction.

Run it.

Then show:

```text
After line 1:
score → 10

After line 4:
score → 20
```

Then:

### Try this

```python
score = 10
score = score + 1
print(score)
```

Ask:

> How can `score` appear on both sides?

Only **after the learner has encountered the mystery** explain assignment:

> Python evaluates the right side first.
> `score + 1` becomes `11`.
> Then the name `score` is made to refer to that new value.

That is much more memorable than defining assignment up front.

Variable assignment is one of the most persistent areas of novice misconception. Research has found misunderstandings around repeated assignment, storing expressions rather than their result, and treating `=` like mathematical equality.

For Python in particular, use a **name/label pointing to a value** as the primary simplified model rather than saying a variable literally *is a box*. A controlled experiment involving 496 novice children and adults found advantages to the label metaphor on repeated-assignment misconceptions.

---

# 5. The site should have a small vocabulary of learning interactions

Do not create dozens of different interaction mechanics.

Use approximately these ten repeatedly:

| Interaction              | What it develops             |
| ------------------------ | ---------------------------- |
| **Predict output**       | Mental execution             |
| **Predict state**        | Understanding variables      |
| **Step through**         | Notional-machine model       |
| **Explain a line**       | Code comprehension           |
| **Change one thing**     | Cause/effect experimentation |
| **Fill one gap**         | Recall with low search space |
| **Arrange code**         | Program structure            |
| **Find the bug**         | Debugging                    |
| **Complete the program** | Supported creation           |
| **Build from a goal**    | Independent programming      |

The learner becomes familiar with the interaction model while the programming itself becomes harder.

---

# 6. A critical product feature: show the machine

Code is static.

Execution is dynamic.

Beginners struggle partly because they cannot see the machine state that experienced programmers simulate mentally.

For suitable lessons, provide an optional **Execution View**:

```text
Current line
────────────────────────
score = score + 2


Names
────────────────────────
score → 12


Output
────────────────────────
Ready!
```

Loops should additionally show:

```text
Iteration: 3

number → 5
total  → 12
```

Functions eventually show:

```text
double(6)

parameter:
number → 6

return value:
12
```

Code tracing and representations of the notional machine are specifically used in programming education to make otherwise-hidden execution behaviour concrete.

The learner should eventually stop needing this view.

That is success.

---

# 7. Core curriculum

The sequence below is deliberately slower than a normal Python course.

Each numbered item is a **micro-lesson**, generally around 5–12 minutes rather than a traditional lesson.

---

# STAGE 0 — The Computer Follows Instructions

## Mental model

> A program is a sequence of precise instructions that the computer executes.

Do not explain Python yet.

Make the machine do things.

---

### 0.1 — Make something happen

Starter:

```python
print("Hello!")
```

Learner presses Run.

**Discovery:** written instructions can cause observable behaviour.

Challenge:

Change `"Hello!"` to something else.

No terminology other than:

> This line is an instruction.

---

### 0.2 — Instructions happen in order

```python
print("First")
print("Second")
print("Third")
```

Ask:

> What order will these appear in?

Then rearrange them.

**Concept:** sequence.

---

### 0.3 — One change → one consequence

```python
print("Ready")
print("Go!")
```

Experiments:

* change a word;
* duplicate a line;
* delete a line;
* reorder lines.

Explicitly establish the habit:

> Change one thing. Run again. Observe what changed.

This becomes the learner's scientific method for programming.

---

### 0.4 — Computers are extremely literal

Give:

```python
print("Hello)
```

Ask the learner to run it.

Do **not** frame the red error as failure.

Say:

> Python tried to understand the instructions but couldn't. Its message gives us clues.

Let them repair the missing quote.

---

### 0.5 — Trace the execution pointer

```python
print("A")
print("B")
print("C")
```

Animate:

```text
▶ line 1
  line 2
  line 3
```

then:

```text
  line 1
▶ line 2
  line 3
```

Introduce:

> Python executes one instruction after another.

---

### 0.6 — First tiny creation

Goal:

> Make the computer introduce an imaginary character using exactly three lines of output.

No prescribed answer.

Example result:

```text
My name is Byte.
I live on Mars.
I love pancakes.
```

This is the learner's first program they can call **mine**.

---

# STAGE 1 — Values and Expressions

## Mental model

> Programs manipulate values. Expressions produce new values.

---

### 1.1 — Values

Run:

```python
print(7)
print("seven")
```

Ask:

> Are these the same thing?

Explain only:

* `7` is a number;
* `"seven"` is text.

Do not introduce a taxonomy of Python types yet.

---

### 1.2 — The computer can calculate

```python
print(4 + 3)
print(10 - 2)
print(6 * 5)
```

Prediction before run.

Then ask learners to modify each calculation.

---

### 1.3 — Expressions collapse into values

Use:

```python
print(2 + 3 * 4)
```

Execution visualisation:

```text
2 + 3 * 4

2 + 12

14
```

Introduce the transferable concept:

> An **expression** is code that produces a value.

---

### 1.4 — Expressions can contain expressions

```python
print((10 + 2) * 3)
```

Have the learner highlight which part is evaluated first.

Then:

```python
print(10 + (2 * 3))
```

Prediction challenge.

---

### 1.5 — Text can be manipulated too

```python
print("ha" + "ha")
print("ha" * 3)
```

Prediction questions should deliberately include plausible wrong answers.

Then ask:

> What do you think `"5" + "2"` produces?

Run it.

This produces a useful conceptual surprise:

```text
52
```

---

### 1.6 — Different values allow different operations

Run:

```python
print("5" + 2)
```

The error becomes the learning object.

Explain:

> `"5"` and `5` may look related to us, but they are different kinds of values.

Now introduce the word **type**, lightly.

---

### 1.7 — Functions as black boxes

The learner has already used `print`.

Now:

```python
print(len("elephant"))
```

Conceptual picture:

```text
"elephant"
     ↓
┌─────────┐
│   len   │
└─────────┘
     ↓
     8
```

Do not explain how `len` works.

Teach the enormously important abstraction:

> Sometimes we can use something by understanding **what goes in and what comes out**, without knowing how it works inside.

---

### 1.8 — Expression mini-challenge

Goal:

> Calculate how many seconds are in 3 minutes.

Then:

> 2 hours?

Then:

> 2 hours and 15 minutes?

Learner creates expressions rather than following syntax instructions.

---

# STAGE 2 — Names, State, and Input

## Mental model

> Programs can give values names, and those relationships can change while the program runs.

---

### 2.1 — Giving a value a name

```python
score = 10
print(score)
```

Visualise:

```text
score ─────→ 10
```

Say:

> `score` is a name referring to the value `10`.

---

### 2.2 — The right side happens first

```python
score = 5 + 3
print(score)
```

Show:

```text
5 + 3
  ↓
  8

score → 8
```

---

### 2.3 — Names make programs meaningful

Compare:

```python
print(12 * 4)
```

with:

```python
price = 12
quantity = 4
print(price * quantity)
```

Ask:

> Which program tells its story better?

Introduce naming as **communication**, not merely syntax.

---

### 2.4 — Values can change over time

```python
score = 10
print(score)

score = 20
print(score)
```

Ask whether `score` contains both values.

Execution View should visibly replace the arrow:

```text
score → 10
```

becomes:

```text
score → 20
```

---

### 2.5 — The famous `x = x + 1`

```python
score = 10
score = score + 1
print(score)
```

Force a prediction.

Then animate:

```text
score = score + 1
        └───────┘
          10 + 1
            ↓
            11

score → 11
```

Key wording:

> Read assignment **right side first, then left side**.

This should become a reusable learner strategy.

---

### 2.6 — Trace multiple pieces of state

```python
coins = 5
stars = 2

coins = coins + 3
stars = stars + 1
coins = coins - 2
```

Learner completes:

| Line  | coins | stars |
| ----- | ----: | ----: |
| start |     — |     — |
| 1     |     5 |     — |
| 2     |     5 |     2 |
| 4     |     ? |     ? |
| 5     |     ? |     ? |
| 6     |     ? |     ? |

Do not immediately let them run it.

Trace first.

---

### 2.7 — Programs can receive information

```python
name = input("What is your name? ")
print("Hello", name)
```

Concept:

```text
user → program → output
```

This is the first explicit **input → processing → output** model, although the terminology needn't yet be formalised.

---

### 2.8 — Input is text

Use the deliberate trap:

```python
age = input("How old are you? ")
print(age + 1)
```

Let it fail.

Then explain the reason.

This is far better than pre-teaching conversion syntax.

---

### 2.9 — Converting representations

Repair:

```python
age_text = input("How old are you? ")
age = int(age_text)

print(age + 1)
```

Make explicit:

```text
keyboard
   ↓
"12"         text
   ↓ int(...)
12           number
```

---

### 2.10 — Build: the future machine

Goal:

```text
What is your name? Maya
How old are you? 12

Hi Maya!
Next year you will be 13.
In five years you will be 17.
```

No new concepts.

This is recombination.

---

# STAGE 3 — Decisions

## Mental model

> Programs can evaluate questions whose answers are true or false and choose different paths.

---

### 3.1 — Questions the computer can answer

Predict:

```python
print(7 > 4)
print(3 == 3)
print(10 < 2)
```

Introduce:

> A comparison produces either `True` or `False`.

---

### 3.2 — Boolean values

```python
is_raining = True
print(is_raining)
```

Then:

```python
temperature = 31
is_hot = temperature > 30

print(is_hot)
```

Make the relationship visible:

```text
temperature > 30
       ↓
     True
       ↓
is_hot → True
```

---

### 3.3 — One-way decision

```python
temperature = 35

if temperature > 30:
    print("It's hot")

print("Done")
```

Trace both `35` and `20`.

The execution visualiser should make the skipped line obvious.

---

### 3.4 — Two possible paths

```python
age = 14

if age >= 13:
    print("Teen")
else:
    print("Child")
```

Ask learners to predict several ages.

---

### 3.5 — Boundaries matter

Compare:

```python
age > 13
```

with:

```python
age >= 13
```

Test:

```text
12
13
14
```

This introduces the idea of **boundary cases** long before formal testing.

---

### 3.6 — More than two paths

```python
score = 72

if score >= 80:
    print("Gold")
elif score >= 60:
    print("Silver")
else:
    print("Bronze")
```

Ask:

> Why does order matter?

Try changing the order deliberately.

---

### 3.7 — Combining conditions

```python
age = 12
height = 145

if age >= 10 and height >= 140:
    print("You can ride")
```

Visualise the two comparisons separately.

---

### 3.8 — Either condition can be enough

```python
is_weekend = False
is_holiday = True

if is_weekend or is_holiday:
    print("No school")
```

Use a simple truth-table interaction rather than teaching formal Boolean algebra.

---

### 3.9 — Negation

```python
is_locked = False

if not is_locked:
    print("Door can open")
```

Keep this lesson short.

---

### 3.10 — Decision challenge

Build a simple recommendation system:

```text
Temperature? 32
Is it raining? no

Wear a hat and take water.
```

The learner decides the conditions.

No new syntax.

---

# STAGE 4 — Repetition and Time

## Mental model

> A loop repeatedly executes instructions, while the program's state may change each time.

---

### 4.1 — Discover the repetition problem

Start with:

```python
print("Jump!")
print("Jump!")
print("Jump!")
print("Jump!")
print("Jump!")
```

Ask:

> This works. What if we needed 100?

Only then reveal a loop.

---

### 4.2 — Repeat something a fixed number of times

```python
for number in range(5):
    print("Jump!")
```

Initially describe it simply:

> Repeat the indented instruction five times.

Do not immediately explain every property of `range`.

---

### 4.3 — The loop variable changes

```python
for number in range(5):
    print(number)
```

Execution:

```text
number → 0
number → 1
number → 2
number → 3
number → 4
```

Ask:

> Why doesn't it print 5?

---

### 4.4 — Use the changing value

```python
for number in range(5):
    print(number * 2)
```

Learner predicts:

```text
0
2
4
6
8
```

Then asks them to make:

```text
0
3
6
9
12
```

---

### 4.5 — State can survive between iterations

```python
total = 0

for number in range(4):
    total = total + 2
    print(total)
```

Step-through is mandatory here.

Show:

```text
iteration 1 → total = 2
iteration 2 → total = 4
iteration 3 → total = 6
iteration 4 → total = 8
```

This is the first introduction to an **accumulator**, without naming the pattern yet.

---

### 4.6 — Decisions inside repetition

```python
for number in range(6):
    if number > 2:
        print(number)
```

The learner now reasons simultaneously about:

* iteration;
* changing state;
* conditionals.

Keep everything else trivial.

---

### 4.7 — Repeat while something remains true

```python
count = 3

while count > 0:
    print(count)
    count = count - 1

print("Go!")
```

Ask:

> What causes this loop to stop?

That question matters more than the syntax.

---

### 4.8 — The infinite loop

Give:

```python
count = 3

while count > 0:
    print(count)
```

Have the platform safely terminate it after a threshold.

Ask:

> Why can `count > 0` never become false?

Key loop mental model:

```text
starting state
     ↓
check condition
     ↓
run body
     ↓
change state
     └────────→ check again
```

---

### 4.9 — Repeat until the user succeeds

```python
answer = ""

while answer != "python":
    answer = input("Secret word: ")

print("Correct!")
```

This makes `while` meaningful rather than merely another loop syntax.

---

### 4.10 — Build: launch sequence

Requirements:

```text
5
4
3
2
1
Launch!
```

Then stretch:

> Ask the user where the countdown should start.

---

# STAGE 5 — Collections

## Mental model

> Programs can treat many related values as one collection and apply the same algorithm to each item.

---

### 5.1 — One name, many values

Compare:

```python
score1 = 12
score2 = 15
score3 = 9
```

with:

```python
scores = [12, 15, 9]
```

Ask:

> What problem does the list solve?

---

### 5.2 — Items have positions

```python
animals = ["cat", "dog", "rabbit"]

print(animals[0])
print(animals[1])
```

Let the learner discover zero-based indexing experimentally.

---

### 5.3 — Boundaries again

Run:

```python
animals = ["cat", "dog", "rabbit"]
print(animals[3])
```

Use the error to connect list size and valid positions.

Visual:

```text
index:    0       1        2
        "cat"   "dog"   "rabbit"
```

---

### 5.4 — Do something for every item

```python
animals = ["cat", "dog", "rabbit"]

for animal in animals:
    print(animal)
```

Teach the transferable interpretation:

> **For each animal in animals…**

not:

> “Here is Python's iterable protocol.”

---

### 5.5 — Combine collections with decisions

```python
scores = [4, 9, 2, 10, 7]

for score in scores:
    if score >= 7:
        print(score)
```

Ask:

> Which values will reach `print`?

---

### 5.6 — Ask questions about collections

```python
names = ["Mia", "Leo", "Ava"]

print(len(names))
print("Leo" in names)
```

Connect `len` back to the earlier black-box function concept.

---

### 5.7 — Collections can change

```python
shopping = ["milk", "bread"]

shopping.append("apples")

print(shopping)
```

Do not dump the entire Python list API.

Only introduce mutation because a program now needs it.

---

### 5.8 — Strings are collections too

```python
word = "python"

for letter in word:
    print(letter)
```

Then:

```python
print(word[0])
```

This creates conceptual transfer rather than another isolated Python trick.

---

### 5.9 — Build: analyse some scores

Given:

```python
scores = [8, 3, 10, 6, 9]
```

Tasks:

* print every score;
* print only scores of 7 or higher;
* count how many scores there are.

Do not yet ask them to total or average — that becomes the next conceptual pattern.

---

# STAGE 6 — Functions and Abstraction

## Mental model

> A function gives a meaningful name to a reusable piece of behaviour. It can receive values and produce a value.

---

### 6.1 — You have been using functions all along

Show:

```python
print("hello")
len("python")
int("12")
input("Name: ")
```

Ask:

> What do all four have in common?

Revisit:

```text
input → function → output
```

---

### 6.2 — Give an action a name

```python
def cheer():
    print("You can do it!")

cheer()
cheer()
```

Highlight separately:

```text
define the function
```

and:

```text
call the function
```

A common beginner confusion is assuming the body runs merely because it was defined.

Explicitly test that misconception.

---

### 6.3 — Give a function information

```python
def greet(name):
    print("Hello", name)

greet("Mia")
greet("Leo")
```

Visualise:

```text
greet("Mia")

name → "Mia"
```

---

### 6.4 — Multiple inputs

```python
def show_score(name, score):
    print(name, "scored", score)
```

Ask learners to call it correctly.

Then deliberately reverse the arguments.

---

### 6.5 — Producing a value

```python
def double(number):
    return number * 2

result = double(6)
print(result)
```

Visual:

```text
6
↓
double
↓
12
```

---

### 6.6 — `return` is not `print`

Compare:

```python
def double(number):
    print(number * 2)
```

and:

```python
def double(number):
    return number * 2
```

Then attempt:

```python
answer = double(6) + 1
```

with both implementations.

This should be a major conceptual lesson.

---

### 6.7 — Functions can be combined

```python
def double(number):
    return number * 2

def add_one(number):
    return number + 1

answer = add_one(double(5))
```

Trace inside-out.

---

### 6.8 — Local state

```python
def calculate():
    result = 10
    print(result)

calculate()
```

Then attempt:

```python
print(result)
```

Introduce local scope as:

> Some names only exist while that function is doing its work.

Do not dump Python's LEGB rules.

---

### 6.9 — Functions as contracts

Present:

```python
def area(width, height):
    ...
```

Before implementing, ask:

```text
What information goes in?
What value should come out?
```

Then provide examples:

```text
area(3, 4) → 12
area(5, 2) → 10
```

This introduces specification by examples.

---

### 6.10 — Build: mini maths toolkit

Implement:

```python
double(number)
is_even(number)
larger(a, b)
```

Every function gets example calls before implementation.

---

# STAGE 7 — Reusable Algorithmic Patterns

## Mental model

> Many apparently different programming problems have the same underlying structure.

This is one of the most important parts of the course.

Do not allow the learner to finish thinking every problem is unique.

---

### 7.1 — Total / accumulate

```python
numbers = [4, 7, 2]

total = 0

for number in numbers:
    total = total + number

print(total)
```

Label the subgoals:

```text
1. Start the accumulator
2. Visit each value
3. Update the accumulator
4. Use the result
```

---

### 7.2 — Count

```python
scores = [4, 9, 2, 10, 7]

count = 0

for score in scores:
    if score >= 7:
        count = count + 1
```

Ask:

> What stayed the same compared with the total example?

---

### 7.3 — Average combines patterns

Learner must recognise:

```text
average = total / count
```

Have them build from known pieces rather than provide final code.

---

### 7.4 — Search

```python
names = ["Mia", "Leo", "Ava"]

found = False

for name in names:
    if name == "Leo":
        found = True

print(found)
```

Focus on:

> We are carrying information forward through the loop.

---

### 7.5 — Best so far

```python
scores = [6, 3, 9, 7]

best = scores[0]

for score in scores:
    if score > best:
        best = score
```

Visualise `best` changing over time.

This is an important general algorithmic idea.

---

### 7.6 — Transform

```python
numbers = [1, 2, 3]

doubled = []

for number in numbers:
    doubled.append(number * 2)
```

Conceptual shape:

```text
input collection
      ↓
transform every item
      ↓
new collection
```

---

### 7.7 — Filter

```python
scores = [4, 9, 2, 10, 7]

high_scores = []

for score in scores:
    if score >= 7:
        high_scores.append(score)
```

Shape:

```text
visit
↓
decide
↓
keep?
```

---

### 7.8 — Validate / repeat until acceptable

```python
age = -1

while age < 0:
    age = int(input("Age: "))
```

Teach the pattern rather than the exact program.

---

### 7.9 — Recognise the pattern

Present problems **without code**:

> How many rainy days were recorded?

> What was the hottest day?

> Which names begin with A?

> Convert every temperature from Celsius to Fahrenheit.

> Find whether a username exists.

Learner chooses:

```text
count
best-so-far
filter
transform
search
```

This is a crucial abstraction test.

---

### 7.10 — Pattern transfer

Take the same underlying algorithm and change its surface completely.

Example:

```text
Count passing scores
```

becomes:

```text
Count rainy days
```

becomes:

```text
Count words longer than five letters
```

The application should explicitly tell the learner afterward:

> These looked different, but all three were the same **count-if** problem.

Programming novices often focus on superficial differences while experts more readily recognise structural problem-solving patterns. Subgoal-oriented instruction is specifically intended to accelerate this transition.

---

# STAGE 8 — Representing Information

## Mental model

> The way we represent information affects how easy our program is to build.

---

### 8.1 — The problem with parallel variables

```python
name = "Mia"
age = 12
score = 88
```

Ask:

> These three values describe the same thing. Can our program represent that relationship?

---

### 8.2 — A record with named fields

```python
student = {
    "name": "Mia",
    "age": 12,
    "score": 88
}
```

Access:

```python
print(student["name"])
```

Teach dictionaries conceptually as:

> Find a value using a meaningful key.

---

### 8.3 — Update a record

```python
student["score"] = 91
```

Connect this back to changing state.

---

### 8.4 — Many structured things

```python
students = [
    {"name": "Mia", "score": 88},
    {"name": "Leo", "score": 72},
    {"name": "Ava", "score": 95}
]
```

Then:

```python
for student in students:
    print(student["name"])
```

This combines:

* collections;
* iteration;
* structured data.

---

### 8.5 — Query structured data

Goal:

> Print the names of every student scoring 80 or higher.

Learner must combine data representation + filtering.

---

### 8.6 — Nested information

Use something understandable:

```python
player = {
    "name": "Nova",
    "scores": [8, 10, 7]
}
```

No arbitrary deep nesting.

Ask:

> What is the type/shape of `player["scores"]`?

---

### 8.7 — Choose the representation

Give scenarios:

```text
Five temperatures
A person with name/age/email
A class containing many students
A shopping cart containing products
```

Learner selects:

```text
single value
list
dictionary
list of dictionaries
```

They should justify the decision.

---

### 8.8 — Build: leaderboard

Data:

```python
players = [
    {"name": "Nova", "score": 84},
    {"name": "Pixel", "score": 93},
    {"name": "Echo", "score": 76}
]
```

Requirements:

* print every player;
* identify the highest scorer;
* count players over 80;
* calculate the average.

This recombines much of the course without adding syntax.

---

# STAGE 9 — Debugging and Correctness

Debugging should have appeared since Stage 0.

Here it becomes an explicit discipline.

A 2024 systematic review found that debugging is frequently under-taught despite requiring program comprehension, accurate mental models, fault-localisation strategies, hypothesis testing, and experience with bugs. It also found that novices often jump into changes before properly constructing a mental model of the program.

---

### 9.1 — Three fundamentally different failures

#### Syntax

```python
print("Hello"
```

Python cannot understand the program.

#### Runtime

```python
number = int("cat")
```

Python understood the program but encountered an impossible operation.

#### Logic

```python
price = 10
quantity = 3

total = price + quantity
```

Program runs successfully but produces the wrong answer.

Learners classify bugs before fixing them.

---

### 9.2 — Read the error message

Provide a genuine traceback.

Teach a simplified order:

```text
1. What kind of error?
2. Which line?
3. What operation was Python attempting?
4. What values were involved?
```

Do not immediately translate the whole error automatically.

Let the learner inspect it first.

---

### 9.3 — Expected versus actual

Every logic bug begins with two statements:

```text
I expected:
_____

I observed:
_____
```

Then ask:

> Where do those two behaviours first become different?

---

### 9.4 — Trace before changing

Broken:

```python
total = 0

for number in [2, 4, 6]:
    total = number

print(total)
```

Expected:

```text
12
```

Actual:

```text
6
```

Do not allow editing immediately.

First complete the state trace:

```text
number    total
2         2
4         4
6         6
```

The bug becomes obvious.

---

### 9.5 — Form a hypothesis

Instead of:

> “Try changing things.”

Teach:

```text
I think ______ is wrong
because ______.

If I am right,
then changing/checking ______ should show ______.
```

Then run the experiment.

Debugging becomes science rather than random mutation.

---

### 9.6 — Make the problem smaller

Provide a failing program processing ten items.

Ask learner to reproduce the bug using two.

Teach:

> Smaller examples are easier to reason about.

---

### 9.7 — Assertions

```python
def double(number):
    return number * 2

assert double(3) == 6
assert double(0) == 0
assert double(-2) == -4
```

Explain:

> A test states something we believe should always be true.

No testing framework yet.

---

### 9.8 — Edge cases

Given:

```python
def average(numbers):
    ...
```

Ask:

> What about one number?

> What about zero?

> What about negative numbers?

> What about an empty list?

Teach:

```text
normal case
boundary case
unusual case
```

---

### 9.9 — Fix one thing, test everything

Give a function with three tests.

A learner changes it until one passes but breaks another.

Introduce regression:

> A fix isn't finished until previous behaviours still work.

---

### 9.10 — Refactor without changing behaviour

Start with duplicated working code.

Tests already pass.

Learner extracts a function.

Tests must still pass.

This teaches the crucial distinction:

```text
behaviour
≠
implementation
```

---

# STAGE 10 — Designing Programs

## Mental model

> Programming begins before code.

---

### 10.1 — Understand through examples

Problem:

> Calculate delivery cost: $5 normally, free for orders of $50 or more.

Before writing code:

```text
order 20 → delivery 5
order 49 → delivery 5
order 50 → delivery 0
order 80 → delivery 0
```

Examples expose the rule.

---

### 10.2 — Inputs → process → outputs

For every new problem, fill:

```text
INPUT
What information do I receive?

PROCESS
What needs to happen?

OUTPUT
What must I produce?
```

Only then enter the editor.

---

### 10.3 — Describe the algorithm in ordinary language

Example:

```text
Ask for the order total.
If it is at least 50,
    delivery costs 0.
Otherwise,
    delivery costs 5.
Show the result.
```

Then convert to Python.

---

### 10.4 — Break the problem apart

Problem:

> Build a quiz.

Ask:

```text
What smaller jobs exist?
```

Possible answers:

```text
ask a question
check an answer
update score
show final score
```

Turn responsibilities into functions only after identifying them conceptually.

---

### 10.5 — Build one working slice

Do **not** write the entire quiz.

Progress:

```text
1 question
↓
1 question + checking
↓
multiple questions
↓
score
↓
final result
```

Teach incremental development.

---

### 10.6 — Function contracts before implementation

For:

```python
def check_answer(expected, actual):
```

Write examples first:

```text
check_answer("Paris", "Paris") → True
check_answer("Paris", "London") → False
```

Then implementation.

This starts to build test-driven reasoning without imposing formal TDD.

---

### 10.7 — Choose representation before algorithm

Problem:

> Keep a collection of quiz questions and answers.

Learner compares:

```python
question1 = ...
answer1 = ...
```

versus:

```python
questions = [
    {"question": "...", "answer": "..."}
]
```

Then explains the choice.

---

### 10.8 — Recognise existing algorithm patterns

Given:

> How many questions did the player answer correctly?

Prompt:

> Have you solved a problem with this **shape** before?

Desired recognition:

```text
count-if
```

---

### 10.9 — Build from acceptance examples

Instead of prose alone, project requirements include examples:

```text
Input:
3, 8, 5

Expected largest:
8
```

and:

```text
Input:
-4, -2, -9

Expected largest:
-2
```

Learner develops implementation against behaviour.

---

### 10.10 — First mostly-independent project

Example: **Treasure Explorer**

Requirements:

* player has a name;
* player starts with points;
* repeated choices;
* choices produce different outcomes;
* points change;
* game eventually ends;
* final result shown.

System provides:

* specification;
* examples;
* optional planning template.

It does **not** provide starter implementation.

---

# STAGE 11 — Connecting Programming to the Real World

These concepts are useful, but they come **after programming fundamentals**.

---

### 11.1 — Libraries are reusable capabilities

```python
import random

number = random.randint(1, 10)
print(number)
```

Mental model:

> Someone else implemented useful behaviour. We can use its public interface.

Connect directly to function abstraction.

---

### 11.2 — Randomness project

Upgrade the earlier guessing program:

```python
secret = random.randint(1, 10)
```

The rest should use already-known concepts.

---

### 11.3 — Programs can persist information

Contrast:

```text
program running → variables exist
program stops → variables disappear
```

Then introduce a file.

Write:

```python
with open("score.txt", "w") as file:
    file.write("100")
```

Read:

```python
with open("score.txt") as file:
    score = file.read()
```

Focus conceptually on **persistent state**, not the mechanics of Python context managers.

---

### 11.4 — Structured persistent data

Use JSON because it naturally resembles the lists/dictionaries already taught:

```python
player = {
    "name": "Nova",
    "score": 100
}
```

Show equivalent JSON and connect representations.

---

### 11.5 — Expected failures

Example:

> What if `score.txt` doesn't exist?

Only now formally introduce exception handling:

```python
try:
    ...
except FileNotFoundError:
    ...
```

Teach:

> Some failures are predictable situations our program may deliberately handle.

---

### 11.6 — Modules organise larger programs

Split:

```text
main.py
scores.py
```

Do not introduce package management.

Teach:

> A large program becomes easier to understand when related responsibilities live together.

---

### 11.7 — Guided final project

Possible projects:

* quiz;
* text adventure;
* habit tracker;
* simple shop;
* score analyser;
* book tracker;
* tournament simulator.

Scaffolding:

```text
Requirements
↓
example behaviours
↓
data-design questions
↓
function-design questions
↓
learner implementation
```

---

### 11.8 — Independent capstone

Learner chooses an idea.

The platform guides the **process**, not the solution:

```text
What does your program do?

Who uses it?

What information does it need?

What information changes?

How will you represent that information?

What are the major responsibilities?

What functions might represent them?

What is the smallest version that could work?

What examples will demonstrate that it works?
```

Then:

```text
plan
→ build
→ test
→ debug
→ improve
→ explain
```

The final requirement should be an explanation:

> “Walk me through how your program works.”

A functioning program without conceptual explanation should not be treated as equivalent to mastery.

---

# 8. The hidden curriculum

Alongside the visible curriculum, continuously develop these habits:

| Habit                      | First appears | Never stops |
| -------------------------- | ------------- | ----------- |
| Predict before running     | Stage 0       | ✓           |
| Read unfamiliar code       | Stage 0       | ✓           |
| Trace execution            | Stage 0       | ✓           |
| Change one thing at a time | Stage 0       | ✓           |
| Read errors                | Stage 0       | ✓           |
| Explain behaviour          | Stage 0       | ✓           |
| Give meaningful names      | Stage 2       | ✓           |
| Check boundaries           | Stage 3       | ✓           |
| Recognise patterns         | Stage 4       | ✓           |
| Break problems apart       | Stage 6       | ✓           |
| Test assumptions           | Stage 6       | ✓           |
| Choose representations     | Stage 8       | ✓           |
| Debug systematically       | Stage 9       | ✓           |
| Refactor safely            | Stage 9       | ✓           |
| Design before coding       | Stage 10      | ✓           |

This hidden curriculum is ultimately more valuable than memorising Python APIs.

---

# 9. Every concept needs multiple modes of mastery

A learner has **not** mastered a concept simply because one coding challenge passed.

For important concepts, check at least four forms of understanding.

## A. Read

```python
x = 5
x = x + 2
print(x)
```

> What happens?

## B. Explain

> Why does the program print 7?

## C. Modify

> Change it so the result becomes 12.

## D. Create

> Write a program starting at 3 and adding 4 twice.

For especially important concepts add:

## E. Debug

Give a nearby misconception.

This corresponds well with the broader read/evaluate/modify/debug/create emphasis now explicit in CSTA's programming standards.

---

# 10. Use misconception probes deliberately

Do not wait for misconceptions to appear accidentally.

Design examples specifically to reveal them.

## Assignment

```python
x = 5
x = 7
```

Ask:

> What is `x` now?

---

## Assignment direction

```python
x = 3
y = x
x = 8
print(y)
```

Ask before running.

---

## `=` versus `==`

Show both in nearby contexts.

---

## Return versus print

```python
def double(x):
    print(x * 2)

answer = double(3)
```

Ask:

> What value is stored in `answer`?

---

## Loop variable

```python
for number in range(3):
    print(number)
```

Ask:

> Does this print `1, 2, 3` or `0, 1, 2`?

---

## Condition boundaries

```python
if age > 12:
```

Ask about exactly `12`.

---

## List indexing

Ask what index holds the first item.

---

## State within loops

```python
total = 0

for number in [2, 3]:
    total = number
```

Contrast with:

```python
total = total + number
```

Misconception questions should be treated as diagnostic learning events, not “gotcha” quizzes.

---

# 11. The hint system

Hints should never jump directly from “stuck” to solution.

Use a five-level ladder.

## Hint 1 — Goal reminder

> What value are you trying to calculate?

## Hint 2 — Concept reminder

> You need to keep a running total as the loop progresses.

## Hint 3 — Structural clue

```text
Create total before the loop.

Inside the loop:
    update total
```

## Hint 4 — Partial implementation

```python
total = 0

for number in numbers:
    total = __________
```

## Hint 5 — Solution with explanation

Reveal the solution.

But revealing a solution triggers a mandatory **near-transfer challenge**.

For example:

If the learner reveals:

> Total all prices.

their next problem becomes:

> Total all distances.

No penalty.

They simply demonstrate that the idea transferred.

---

# 12. The AI tutor should coach, not complete

The AI should follow this decision order:

```text
Can the learner articulate the problem?
↓
Can they predict what their current code does?
↓
Can they locate the relevant part?
↓
Can they describe the difference between expected and actual?
↓
Can they identify the programming concept involved?
↓
Give conceptual hint.
↓
Give structural hint.
↓
Give partial code.
↓
Only finally reveal implementation.
```

The AI should almost never respond to:

> “Why doesn't this work?”

with:

> “Here's the corrected program.”

Instead:

> “Your loop currently replaces `total` on every iteration. Before changing anything, what values do you think `total` has after the first, second, and third iterations?”

That creates learning.

---

# 13. Experimentation should be explicitly rewarded

Every few lessons include a **What If?** card.

Examples:

> What happens if the number is negative?

> What happens if the list is empty?

> What happens if you remove this line?

> What happens if these two lines swap places?

> What happens if the condition is always true?

> Can this be done with one fewer variable?

These are optional.

There is no Check Answer button.

They exist purely to encourage curiosity.

That distinction is important: not every interaction should feel like an assessment.

---

# 14. Preserve experiments

The editor should make experimentation psychologically cheap.

Provide:

```text
Reset
Undo
Redo
```

and ideally:

```text
Original | My version
```

When a learner changes something important, it can optionally highlight:

```diff
- score = score + 1
+ score = score + 5
```

The learner should never fear “breaking” the lesson.

Breaking things is part of learning programming.

---

# 15. Prediction should not become annoying

Do not ask for a prediction before **every** Run.

Use it when:

* a concept is new;
* a result is likely to challenge a misconception;
* execution state matters;
* a transfer check is useful.

After the learner understands a concept, Run should again become immediate.

The pedagogical mechanic must never become interface friction.

---

# 16. Explanations should follow semantic waves

For difficult concepts use:

```text
precise concept
↓
simple concrete explanation
↓
visual/example
↓
code
↓
precise concept again
```

For example:

> **Assignment** changes which value a name refers to.

Then:

> Think of moving the label `score` from the old value to the new value.

Then visualise:

```text
score ─→ 10

score = 20

10       20
         ↑
       score
```

Then execute Python.

Finally:

> This operation is called **assignment**.

Raspberry Pi's pedagogy guidance recommends exactly this kind of movement between abstract technical language and concrete explanations rather than leaving learners permanently with the metaphor.

---

# 17. Use spaced retrieval throughout the course

Concepts must come back.

Do not have:

```text
Chapter 2: Variables

[never explicitly assessed again]
```

Instead schedule retrieval approximately like:

```text
first exposure

+ 1–2 lessons
+ ~5 lessons
+ next unit
+ several units later
+ project
```

Examples:

A conditional lesson can unexpectedly include variable tracing.

A list lesson can retrieve loops.

A function lesson can retrieve expressions.

A debugging exercise can retrieve all three.

Research on a spaced, interleaved retrieval tool used in an introductory Python course found positive associations between tool usage and final performance, while broader retrieval-practice evidence supports spaced recall for long-term retention.

Do not label every retrieval exercise:

> REVIEW OF VARIABLES

Just naturally use the concept again.

---

# 18. Unit checkpoints

Every major stage ends with three activities.

## 1. Tiny retrieval

Three or four short questions from earlier concepts.

## 2. Transfer challenge

Same underlying idea in a context the learner has never seen.

## 3. Mini-build

Something personally satisfying that uses only mastered concepts.

Examples:

| Stage          | Mini-build                   |
| -------------- | ---------------------------- |
| Instructions   | Character introduction       |
| Values         | Mini calculator              |
| State/input    | Future-age machine           |
| Decisions      | Recommendation machine       |
| Loops          | Countdown / repeated pattern |
| Collections    | Score analyser               |
| Functions      | Maths toolkit                |
| Patterns       | Statistics explorer          |
| Data           | Leaderboard                  |
| Debugging      | Repair challenge             |
| Program design | Quiz                         |
| Final          | Learner-selected project     |

---

# 19. Difficulty should vary on two independent axes

Do not confuse **more code** with **harder thinking**.

A challenge can increase:

### Conceptual difficulty

```text
one variable
→ multiple variables
→ condition
→ loop
→ loop + condition
→ collection + loop + state
```

or:

### Construction difficulty

```text
predict
→ modify
→ fill gap
→ arrange
→ complete
→ create
```

Change only one axis aggressively at a time.

For example:

When introducing loops, give complete working code.

When later asking them to create a loop themselves, keep the underlying problem very simple.

---

# 20. Age-neutrality

The conceptual curriculum should be identical for children and adults.

Do not create a “kids curriculum” and “adult curriculum.”

Instead separate:

```text
CONCEPT
from
SURFACE THEME
```

For example the exact same filtering problem can appear as:

### Games

> Find all players with more than 100 points.

### Sport

> Find all scores above 80.

### Space

> Find planets warmer than 0°C.

### Everyday

> Find products under $20.

Let learners optionally select interests.

But all variants should map to the same underlying lesson definition.

This also makes the content system dramatically easier to maintain.

---

# 21. Avoid artificial typing work

Never make beginners manually type this just because programmers eventually must:

```python
numbers = [4, 7, 3, 8, 2, 9, 1, 5]
```

Preload irrelevant boilerplate.

The learner should type the **thing being learned**.

As independence grows, preload less.

The scaffold should fade naturally:

```text
95% supplied
↓
75%
↓
50%
↓
25%
↓
0%
```

---

# 22. Do not over-reward clever Python

Early curriculum code should favour transparent execution.

Prefer:

```python
high_scores = []

for score in scores:
    if score >= 7:
        high_scores.append(score)
```

over:

```python
high_scores = [x for x in scores if x >= 7]
```

The longer version exposes:

```text
iteration
selection
state
construction
```

Once those concepts are internalised, the concise Python version becomes useful rather than magical.

---

# 23. Python features that should NOT be in the core path

Keep these out of the beginner programming curriculum:

```text
list comprehensions
dictionary comprehensions
lambda
decorators
generators
yield
*args / **kwargs
advanced slicing
match/case
dunder methods
inheritance
multiple inheritance
properties
advanced exceptions
regular expressions
virtual environments
package publishing
async/await
metaclasses
```

These are Python topics, not prerequisites for understanding programming.

---

# 24. Post-core “Become Fluent in Python” track

After the learner can program independently, introduce language-specific power tools.

Suggested sequence:

```text
Python idioms
↓
slicing
↓
enumerate
↓
zip
↓
tuples
↓
sets
↓
comprehensions
↓
richer exceptions
↓
classes / objects
↓
modules and packages
↓
third-party libraries
↓
HTTP / APIs
↓
typing
```

At this point explain:

> These ideas help you become a stronger **Python programmer**.

That is deliberately distinct from:

> learning how to program.

For comparison, courses such as CS50P quite reasonably cover exceptions, libraries, unit testing, file I/O, regular expressions, and object-oriented programming as part of learning Python. This product should postpone many of those because its primary target is the deeper transferable programming model rather than Python coverage.

---

# 25. Mastery model

Do not display a simplistic:

```text
Variables ✓
```

after one correct question.

Internally model mastery across capabilities.

For example:

```text
VARIABLES

read       █████
trace      █████
explain    ████░
modify     █████
debug      ███░░
create     ████░
transfer   ███░░
```

The learner-facing UI can remain simple.

Internally this makes adaptation much smarter.

---

# 26. Adaptive behaviour

If a learner repeatedly struggles with creation:

```text
create
↓
partial completion
↓
Parsons problem
↓
worked example
↓
trace
```

Then climb back upward.

If they rapidly succeed:

```text
predict
↓
modify
↓
transfer
```

and omit redundant exercises.

Never skip the **concept**, only unnecessary repetitions.

---

# 27. Correctness checking

The Check Answer system should generally test **behaviour**, not exact source code.

Bad:

```text
Your code doesn't contain:
for x in numbers
```

Better:

```text
Input: [2, 3, 4]
Expected: 9
Received: 9
✓
```

Only constrain implementation when the exercise explicitly teaches a technique.

Example:

> “Solve this using a loop rather than `sum()`.”

Then structure matters because the loop itself is the learning objective.

Otherwise, alternate correct solutions should be celebrated.

---

# 28. Feedback should explain evidence, not judgement

Avoid:

> ❌ Wrong.

Prefer:

```text
Not quite.

For:
numbers = [2, 4, 6]

Expected:
12

Your program produced:
6

Try tracing the value of `total` after each iteration.
```

The system gives the learner an observation and directs their attention.

It does not immediately diagnose everything for them.

---

# 29. The ideal lesson data model

Each lesson should be content rather than bespoke frontend logic.

Conceptually:

```yaml
id: loops-accumulator-01
title: Keeping a Running Total

concepts:
  - iteration
  - state
  - accumulator

prerequisites:
  - for-loop
  - assignment
  - expressions

learning_goal:
  "Understand that state can persist and change across loop iterations."

misconceptions:
  - "The variable resets every iteration"
  - "Assignment adds automatically"
  - "The loop remembers previous numbers without explicit state"

starter_code: |
  total = 0

  for number in [2, 3, 4]:
      total = total + number

  print(total)

activities:
  - type: predict_output
  - type: state_trace
  - type: run
  - type: explain
  - type: modify
  - type: debug
  - type: transfer

hints:
  - level: conceptual
  - level: directional
  - level: structural
  - level: partial_code
  - level: solution

tests:
  - visible: true
  - hidden: true

retrieval_tags:
  - variables
  - assignment
  - loops

stretch:
  - "What happens if total starts at 10?"
```

That allows the curriculum to evolve without changing application code.

---

# 30. Given the current site design

The layout you have been moving toward actually suits this pedagogy extremely well:

```text
LEFT
Lesson / explanation

CENTRE
Code editor

RIGHT
Output / Hint

BOTTOM STICKY BAR
Run | Check Answer | Next
```

I would add only one conceptual layer:

### Before selected runs

temporarily turn the output area into:

```text
What do you think will happen?

[ prediction ]
```

Then Run reveals reality.

For tracing lessons, Output can temporarily become:

```text
Output | Execution
```

rather than permanently adding another large panel.

That preserves the clean layout while making the notional machine available exactly when pedagogically useful.

---

# 31. Content-writing rule for the team

Every lesson author should be able to complete this sentence:

> “The learner currently believes/understands ______. This experiment allows them to discover ______.”

If there is no meaningful answer, the lesson probably does not deserve to exist.

A lesson should not exist merely because:

> “Python has this syntax.”

---

# 32. A second rule: one conceptual surprise at a time

Bad lesson:

```text
Introduce:
lists
for loops
indexes
len()
append()
range()
```

Good progression:

```text
I need many related values.
↓
A list represents them.
↓
I can access one by position.
↓
I can visit them one at a time.
↓
I can ask how many there are.
↓
I can add another.
```

Every step has a reason.

---

# 33. A third rule: new syntax should solve a problem the learner already feels

Do not say:

> “Today we are learning loops.”

First create repetition.

Do not say:

> “Today we are learning functions.”

First create duplication.

Do not say:

> “Today we are learning dictionaries.”

First create data that obviously belongs together.

Do not say:

> “Today we are learning tests.”

First show how changing one thing can silently break another.

Programming constructs should arrive as **solutions to problems**.

---

# 34. The emotional design

Errors should be normal.

Do not celebrate only green ticks.

Sometimes explicitly tell the learner:

> “This program is supposed to break. Run it.”

or:

> “Excellent — now we have something useful to investigate.”

But avoid empty encouragement.

The satisfaction should come from:

```text
prediction
→ observation
→ understanding
```

not a confetti animation after every trivial action.

---

# 35. Course progression should feel like ownership increasing

At the beginning:

> “Here is my program. Explore it.”

Then:

> “Change my program.”

Then:

> “Finish our program.”

Eventually:

> “Build your program.”

That gradual ownership is central to both PRIMM and Use–Modify–Create approaches.

---

# 36. The final learner progression

The learner begins thinking:

```text
Programming =
typing strange commands correctly
```

Then:

```text
Programming =
telling a computer what to do
```

Then:

```text
Programming =
values changing over time
```

Then:

```text
Programming =
sequence + decisions + repetition + state
```

Then:

```text
Programming =
combining reusable abstractions
```

Then:

```text
Programming =
recognising common problem patterns
```

Then:

```text
Programming =
representing information appropriately
```

Then:

```text
Programming =
forming and testing hypotheses when behaviour is wrong
```

And finally:

```text
Programming =
turning an unclear problem
into a precise,
testable,
executable solution.
```

That is the transformation the curriculum should optimise for.

---

# 37. Definition of done for the core course

A learner who completes the course should be comfortable with:

### Execution

Understanding that programs execute over time and being able to trace that execution.

### Values and expressions

Understanding values, operations, and expressions.

### State

Understanding names, assignment, reassignment, and changing state.

### Input/output

Understanding how information enters and leaves a program.

### Selection

Understanding conditions, Boolean values, and branching.

### Iteration

Understanding repetition and how state evolves through loops.

### Collections

Representing and processing multiple values.

### Functions

Using abstraction, parameters, return values, composition, and local state.

### Algorithmic patterns

Recognising accumulation, counting, searching, transformation, filtering, validation, and best-so-far patterns.

### Data representation

Choosing sensible representations for information.

### Debugging

Tracing actual behaviour, forming hypotheses, locating faults, and verifying fixes.

### Testing

Thinking in examples, boundaries, expected behaviours, and regressions.

### Decomposition

Breaking larger problems into meaningful smaller responsibilities.

### Algorithm design

Moving from examples and requirements to a precise procedure.

### Independent creation

Building a small useful program without copying a tutorial.

---

# 38. The north-star assessment

The final assessment should **not** ask:

> What does `append()` do?

or:

> What keyword defines a function?

Those can be looked up.

Instead give the learner something they have never seen:

> You run a small game club. Players enter scores during the day. Build a program that stores each player's name and score, shows the highest score, calculates the average, and lists everyone scoring above the average.

Then observe whether they can:

```text
understand
↓
model the information
↓
recognise patterns
↓
decompose
↓
implement
↓
test
↓
debug
↓
explain
```

A learner who can do that has learned programming.

Even if they occasionally need to look up Python syntax.

That is exactly the outcome this course should be designed to produce.
