# PARKING LOT SYSTEM - REQUIREMENTS DOCUMENT

## PROJECT SCOPE:
A comprehensive parking lot management system for a multi-floor building that handles vehicle parking, spot allocation, fee calculation, and real-time availability tracking. The system supports multiple vehicle types, dynamic pricing, efficient spot management, and intelligent allocation based on vehicle type and expected parking duration.

---

## PRIMARY FEATURES (CORE/MVP):

### 1. **Parking Spot Management**
   - Support multiple vehicle types (Car, Motorcycle, Truck, Van)
   - Different spot sizes (Compact, Standard, Large, Handicapped)
   - Track spot availability in real-time
   - Automatic spot assignment based on vehicle type

### 2. **Vehicle Entry and Exit**
   - Issue parking ticket on entry with timestamp
   - Record vehicle details (license plate, type, color)
   - Capture expected parking duration at entry
   - Process exit with ticket validation
   - Calculate actual parking duration

### 3. **Intelligent Spot Allocation Strategy**
   - **Primary:** Assign spots based on vehicle type and expected parking duration
   - Nearest available spot allocation considering duration
   - Long-duration vehicles assigned to less accessible spots (back areas)
   - Short-duration vehicles assigned to easily accessible spots (near gates)
   - Spot matching based on vehicle size
   - Handle edge cases (no spots available)
   - Prevent double booking

### 4. **Fee Calculation System**
   - Hourly rate-based pricing
   - Different rates for different vehicle types
   - Support for flat fee and time-based charging
   - Automatic fee calculation on exit
   - Penalty for exceeding expected duration

### 5. **Parking Lot Structure**
   - Multi-floor support (floors and levels)
   - Multiple entry/exit gates per floor
   - Capacity management per floor
   - Display available spots per floor
   - Spot distance/accessibility metadata (distance from entry gate)

### 6. **Real-time Display System**
   - Show available spots per vehicle type
   - Display floor-wise availability
   - Show total occupancy statistics
   - Update display on entry/exit
   - Display average parking duration statistics

---

## SECONDARY FEATURES:

### 1. **Payment Processing**
   - Support multiple payment methods (Cash, Card, Digital Wallet)
   - Generate payment receipts
   - Track payment status (Paid, Pending, Failed)
   - Additional charges for duration overstay

### 2. **Reservation System**
   - Pre-booking spots for specific time slots
   - Reserve spots by vehicle type and duration
   - Cancellation and modification support
   - Priority allocation for reserved spots

### 3. **Admin Management Panel**
   - Add/remove parking spots
   - Modify pricing configurations
   - Configure spot accessibility levels
   - View occupancy reports
   - Manage gate operations
   - View duration-based allocation analytics

---

## FUTURE ENHANCEMENTS:

### 1. **Dynamic Pricing**
   - Peak hour surge pricing
   - Weekend/holiday special rates
   - Loyalty discounts for frequent users
   - Duration-based discount tiers

### 2. **Integration with External Systems**
   - Mobile app integration
   - Online payment gateway integration
   - SMS/Email notifications for ticket and payment
   - RFID/License plate recognition
   - Calendar integration for duration estimation

### 3. **Advanced Analytics**
   - Historical parking trends
   - Revenue analytics
   - Predictive availability forecasting based on time patterns
   - Heat maps for spot utilization
   - Duration accuracy analysis (expected vs actual)
   - Optimization suggestions for spot placement

---

## KEY DESIGN NOTES:

- **Singleton Pattern:** Used for ParkingLot (single instance per building)
- **Factory Pattern:** Create different vehicle types and parking spots
- **Strategy Pattern:** Different allocation strategies (duration-based, nearest, random) and pricing strategies
- **State Pattern:** Parking spot states (Available, Occupied, Reserved, OutOfService)
- **Observer Pattern:** Real-time display board updates

---

## SPOT ALLOCATION LOGIC:

### **Duration-Based Allocation Rules:**

1. **Short Duration (< 2 hours):**
   - Assign spots closest to entry/exit gates
   - Priority: High accessibility zones
   - Optimize for quick turnover

2. **Medium Duration (2-6 hours):**
   - Assign spots in mid-range accessibility zones
   - Balance between convenience and space optimization

3. **Long Duration (> 6 hours):**
   - Assign spots in back areas or less accessible zones
   - Priority: Space optimization over convenience
   - Free up prime spots for short-duration parkers

4. **Fallback Strategy:**
   - If preferred zone full, allocate next best available spot
   - Always respect vehicle type and spot size compatibility

### **Spot Accessibility Levels:**
- **HIGH:** Near entry/exit gates (10-20% of spots)
- **MEDIUM:** Mid-level accessibility (50-60% of spots)
- **LOW:** Back areas, corners (20-30% of spots)

---

## DESIGN CONSTRAINTS:

- Each parking spot can accommodate only one vehicle at a time
- Larger spots can accommodate smaller vehicles (but not vice versa)
- Entry/exit gates must process one vehicle at a time
- Parking tickets are unique and non-reusable
- Fee calculation happens only at exit
- Expected duration is advisory, not binding
- Overstay charges apply if actual > expected duration by 20%

---

## ASSUMPTIONS:

- Building has multiple floors (configurable, default: 5 floors)
- Each floor has multiple spots of different types
- System operates 24/7
- Users provide expected parking duration at entry
- No advance payment required (pay on exit)
- Lost ticket handling with maximum fee penalty
- Spot accessibility levels are pre-configured per spot

---

## IMPLEMENTATION DETAILS:

- **Technology:** Node.js with TypeScript
- **Interface:** Console-based dynamic input with readline
- **Storage:** In-memory data layer using Maps
- **Architecture:** Layered architecture (Models → Repositories → Services → Controllers → Console)
- **Design Patterns:** Singleton, Factory, Strategy (Allocation + Pricing), State, Observer
- **Allocation Strategy:** Duration-aware spot allocation with accessibility scoring

---

## DATA TO CAPTURE:

### **At Entry:**
- Vehicle details (license plate, type, color)
- Expected parking duration (in hours)
- Entry timestamp
- Entry gate ID
- Assigned spot ID and accessibility level

### **At Exit:**
- Exit timestamp
- Actual parking duration
- Fee breakdown (base + overstay penalty)
- Payment method and status
- Exit gate ID

---

## SUCCESS METRICS:

✅ Support 4+ vehicle types  
✅ Handle 3+ spot categories  
✅ Implement 3 accessibility levels  
✅ Process entry/exit in < 5 seconds  
✅ Real-time availability display  
✅ Accurate fee calculation with overstay penalties  
✅ Thread-safe spot allocation  
✅ Duration-based allocation accuracy > 90%  
✅ Optimal spot utilization (< 10% misallocation)  

---

## EDGE CASES TO HANDLE:

1. **No spots available** → Suggest waiting or alternative floors
2. **Lost parking ticket** → Apply maximum fee penalty
3. **Expected duration = 0 or null** → Default to 2 hours, use medium accessibility
4. **Overstay > 2x expected** → Additional penalty charges
5. **Vehicle type mismatch** → Only allow upgrade, not downgrade
6. **Spot goes out of service** → Reassign vehicle if occupied
7. **Multiple vehicles same license plate** → Prevent duplicate entry

---

**Document Version:** 1.1  
**Last Updated:** December 10, 2025  
**Status:** Ready for Class Diagram Design
