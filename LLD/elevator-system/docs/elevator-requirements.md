ELEVATOR SYSTEM - REQUIREMENTS DOCUMENT
=========================================

PROJECT SCOPE:
Design and implement an Elevator System for a multi-story building with multiple elevator cars.

---

PRIMARY FEATURES (CORE/MVP):
-----------------------------

1. Multiple Elevator Management
   - Support multiple elevator cars operating independently within a building
   - Configurable number of floors
   - Each elevator operates as an independent unit

2. Request Handling
   - External requests: Common UP/DOWN buttons at each floor (shared hall panel) to call any available elevator
   - Internal requests: Floor number buttons inside elevator cabin to select destination
   - Note: Ground floor has only UP button, top floor has only DOWN button

3. Elevator Movement Control
   - Handle three states: moving up, moving down, and idle/stopped
   - Smooth transitions between states
   - Process floor-to-floor movement

4. Door Operations
   - Control door open/close functionality
   - Ensure doors only open when elevator is idle and at a floor
   - Safety checks before door operations

5. Elevator Scheduling
   - Implement basic scheduling algorithm (nearest elevator first)
   - Assign optimal elevator for incoming external requests
   - Distribute load among multiple elevators efficiently

6. Capacity Management
   - Enforce weight/passenger capacity limits for each elevator
   - Prevent overloading
   - Reject internal requests if capacity exceeded

---

SECONDARY FEATURES:
-------------------

1. Direction-based Request Optimization
   - Prioritize requests in the current direction of travel before reversing
   - Similar to SCAN/LOOK algorithms
   - Improve efficiency and reduce wait time

2. Display System
   - Show current floor number and direction indicator inside cabin
   - Display at each floor panel showing elevator positions
   - Real-time status updates

---

FUTURE ENHANCEMENTS:
--------------------

1. Pluggable Scheduling Strategies
   - Support for different algorithms (FCFS, SSTF, SCAN, LOOK)
   - Strategy pattern implementation for runtime switching
   - Performance comparison between algorithms

2. Elevator Maintenance Mode
   - Allow elevators to be taken offline for maintenance
   - System continues operating with remaining elevators
   - Prevent new requests assignment to maintenance-mode elevators

---

KEY DESIGN NOTES:
-----------------
- Common hall buttons (not individual buttons per elevator)
- Elevator control system makes intelligent assignment decisions
- Focus on optimization and efficiency
- Extensible design for future enhancements

---

IMPLEMENTATION DETAILS:
-----------------------
- Technology: Node.js with TypeScript
- Interface: Console-based dynamic input
- Storage: In-memory data layer (no real database)
- Architecture: Replaceable storage layer through single file change

---

Document Version: 1.0
Last Updated: December 04, 2025
