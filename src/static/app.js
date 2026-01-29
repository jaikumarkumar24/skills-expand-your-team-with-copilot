document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");
  const viewModeButtons = document.querySelectorAll(".view-mode-button");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Dark mode elements
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const darkModeIcon = darkModeToggle?.querySelector(".icon");
  const darkModeText = darkModeToggle?.querySelector(".button-text");

  // Initialize dark mode
  function initializeDarkMode() {
    if (!darkModeToggle) return;

    const darkModeEnabled = localStorage.getItem("darkMode") === "enabled";
    // Remove the init class if it was applied and clear inline styles
    document.documentElement.classList.remove("dark-mode-init");
    document.documentElement.style.cssText = "";

    if (darkModeEnabled) {
      document.body.classList.add("dark-mode");
      if (darkModeIcon) darkModeIcon.textContent = "☀️";
      if (darkModeText) darkModeText.textContent = "Light Mode";
      darkModeToggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      darkModeToggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");

    if (isDarkMode) {
      localStorage.setItem("darkMode", "enabled");
      if (darkModeIcon) darkModeIcon.textContent = "☀️";
      if (darkModeText) darkModeText.textContent = "Light Mode";
      if (darkModeToggle) darkModeToggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      localStorage.setItem("darkMode", "disabled");
      if (darkModeIcon) darkModeIcon.textContent = "🌙";
      if (darkModeText) darkModeText.textContent = "Dark Mode";
      if (darkModeToggle) darkModeToggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  // Event listener for dark mode toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleDarkMode);
  }

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";
  let viewMode = "filter"; // "filter" or "group" or "calendar"

  // Calendar view constants
  const CALENDAR_START_HOUR = 6;
  const CALENDAR_END_HOUR = 18;

  // Authentication state
  let currentUser = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Before school hours
    afternoon: { start: "15:00", end: "18:00" }, // After school hours
    weekend: { days: ["Saturday", "Sunday"] }, // Weekend days
  };

  // Initialize filters from active elements
  function initializeFilters() {
    // Initialize day filter
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    // Initialize time filter
    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    // Update active class
    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    // Update active class
    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Verify the stored user with the server
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout(); // Clear invalid data
      }
    }

    // Set authentication class on body
    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        // Session invalid, log out
        logout();
        return;
      }

      // Session is valid, update user data
      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
    }

    updateAuthBodyClass();
    // Refresh the activities to update the UI
    fetchActivities();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(
          data.detail || "Invalid username or password",
          "error"
        );
        return false;
      }

      // Login successful
      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  // Close login modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    // Create more skeleton cards to fill the screen since they're smaller now
    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    // If schedule_details is available, use the structured data
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      // Convert 24h time format to 12h AM/PM format for display
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    // Fallback to the string format if schedule_details isn't available
    return details.schedule;
  }

  // Function to determine activity type (this would ideally come from backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    } else if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    } else if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    } else if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    } else if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    // Default to "academic" if no match
    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    // Show loading skeletons first
    showLoadingSkeletons();

    try {
      // Build query string with filters if they exist
      let queryParams = [];

      // Handle day filter
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      // Handle time range filter
      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        // Handle weekend special case
        if (currentTimeRange === "weekend") {
          // Don't add time parameters for weekend filter
          // Weekend filtering will be handled on the client side
        } else if (range) {
          // Add time parameters for before/after school
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      // Save the activities data
      allActivities = activities;

      // Apply search and filter, and handle weekend filter in client
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    // Clear the activities list
    activitiesList.innerHTML = "";

    // Apply client-side filtering - this handles category filter and search, plus weekend filter
    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      // Apply category filter only in filter mode
      if (viewMode === "filter" && currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      // Apply weekend filter if selected
      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      // Apply search filter
      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (
        searchQuery &&
        !searchableContent.includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      // Activity passed all filters, add to filtered list
      filteredActivities[name] = details;
    });

    // Check if there are any results
    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    // Display based on view mode
    if (viewMode === "group") {
      displayGroupedActivities(filteredActivities);
    } else if (viewMode === "calendar") {
      displayCalendarView(filteredActivities);
    } else {
      displayFlatActivities(filteredActivities);
    }
  }

  // Function to display activities in flat list (existing behavior)
  function displayFlatActivities(activities) {
    Object.entries(activities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  // Function to display activities grouped by category
  function displayGroupedActivities(activities) {
    // Group activities by type
    const grouped = {
      sports: [],
      arts: [],
      academic: [],
      community: [],
      technology: []
    };

    Object.entries(activities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);
      grouped[activityType].push({ name, details });
    });

    // Display each group with a header
    Object.entries(grouped).forEach(([type, items]) => {
      if (items.length === 0) return;

      const typeInfo = activityTypes[type];
      
      // Create group header
      const groupHeader = document.createElement("div");
      groupHeader.className = "activity-group-header";
      groupHeader.setAttribute("data-category", type);
      groupHeader.innerHTML = `
        <h3>
          ${typeInfo.label} <span class="group-count">(${items.length})</span>
        </h3>
      `;
      activitiesList.appendChild(groupHeader);

      // Create group container
      const groupContainer = document.createElement("div");
      groupContainer.className = "activity-group";
      activitiesList.appendChild(groupContainer);

      // Render activities in this group
      items.forEach(({ name, details }) => {
        const card = createActivityCardElement(name, details);
        groupContainer.appendChild(card);
      });
    });
  }

  // Helper function to escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to parse and validate time strings
  function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return { hour, minute };
  }

  // Function to display activities in calendar view
  function displayCalendarView(activities) {
    // Days of the week in order (Sunday to Saturday)
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Time slots from CALENDAR_START_HOUR to CALENDAR_END_HOUR (in 24-hour format)
    const timeSlots = [];
    for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Create calendar container
    const calendarContainer = document.createElement("div");
    calendarContainer.className = "calendar-view";
    
    const calendarGrid = document.createElement("div");
    calendarGrid.className = "calendar-grid";
    
    // Add header row
    const timeHeaderCell = document.createElement("div");
    timeHeaderCell.className = "calendar-header";
    timeHeaderCell.textContent = "Time";
    calendarGrid.appendChild(timeHeaderCell);
    
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "calendar-header";
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Create a map to hold activities by day and time slot
    const activityMap = {};
    daysOfWeek.forEach(day => {
      activityMap[day] = {};
      timeSlots.forEach(time => {
        activityMap[day][time] = [];
      });
    });
    
    // Populate activity map
    Object.entries(activities).forEach(([name, details]) => {
      if (!details.schedule_details) return;
      
      const { days, start_time, end_time } = details.schedule_details;
      
      // Validate time format
      const startTimeParsed = parseTime(start_time);
      const endTimeParsed = parseTime(end_time);
      
      if (!startTimeParsed || !endTimeParsed) {
        console.warn(`Invalid time format for activity "${name}": start_time=${start_time}, end_time=${end_time}`);
        return;
      }
      
      const startHour = startTimeParsed.hour;
      const endHour = endTimeParsed.hour;
      
      // Skip activities outside the displayable range
      if (startHour > CALENDAR_END_HOUR || endHour < CALENDAR_START_HOUR) {
        return;
      }
      
      days.forEach(day => {
        if (daysOfWeek.includes(day)) {
          // Only add to the starting hour time slot
          const timeSlot = `${startHour.toString().padStart(2, '0')}:00`;
          if (activityMap[day] && activityMap[day][timeSlot]) {
            activityMap[day][timeSlot].push({
              name,
              details,
              startTime: start_time,
              endTime: end_time
            });
          }
        }
      });
    });
    
    // Add time rows with cells
    timeSlots.forEach((timeSlot, timeIndex) => {
      // Time label
      const timeLabel = document.createElement("div");
      timeLabel.className = "calendar-time-label";
      const hour = parseInt(timeSlot.split(':')[0]);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      timeLabel.textContent = `${displayHour}:00 ${period}`;
      calendarGrid.appendChild(timeLabel);
      
      // Day cells
      daysOfWeek.forEach(day => {
        const cell = document.createElement("div");
        cell.className = "calendar-cell";
        
        const activitiesInSlot = activityMap[day][timeSlot];
        
        // Add activities to this cell
        activitiesInSlot.forEach((activity, index) => {
          const activityElement = createCalendarActivityElement(
            activity.name, 
            activity.details, 
            activity.startTime, 
            activity.endTime,
            timeSlot,
            index,
            activitiesInSlot.length
          );
          cell.appendChild(activityElement);
        });
        
        calendarGrid.appendChild(cell);
      });
    });
    
    calendarContainer.appendChild(calendarGrid);
    activitiesList.appendChild(calendarContainer);
  }
  
  // Function to create a calendar activity element
  function createCalendarActivityElement(name, details, startTime, endTime, cellTime, overlapIndex, totalOverlap) {
    const activityEl = document.createElement("div");
    activityEl.className = "calendar-activity";
    
    // Determine activity type for color coding
    const activityType = getActivityType(name, details.description);
    activityEl.setAttribute("data-category", activityType);
    
    // Apply overlap styling if there are multiple activities
    if (totalOverlap > 1 && overlapIndex < 5) {
      activityEl.classList.add(`overlap-${overlapIndex}`);
    }
    
    // Parse and validate time values
    const startTimeParsed = parseTime(startTime);
    const endTimeParsed = parseTime(endTime);
    const cellTimeParsed = parseTime(cellTime);
    
    if (!startTimeParsed || !endTimeParsed || !cellTimeParsed) {
      console.warn(`Invalid time format for activity "${name}"`);
      return activityEl; // Return empty element to avoid breaking the calendar
    }
    
    const startHour = startTimeParsed.hour;
    const startMinute = startTimeParsed.minute;
    const endHour = endTimeParsed.hour;
    const endMinute = endTimeParsed.minute;
    const cellHour = cellTimeParsed.hour;
    
    // Calculate top position (in percentage of cell height)
    const topPercentage = cellHour === startHour ? (startMinute / 60) * 100 : 0;
    
    // Calculate height (in percentage across potentially multiple cells)
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const minutesInThisCell = cellHour === startHour 
      ? Math.min(60 - startMinute, totalMinutes)
      : Math.min(60, totalMinutes - ((cellHour - startHour) * 60));
    const heightPercentage = (minutesInThisCell / 60) * 100;
    
    activityEl.style.top = `${topPercentage}%`;
    activityEl.style.height = `${heightPercentage}%`;
    
    // Get enrollment info
    const enrolled = details.participants.length;
    const maxParticipants = details.max_participants;
    
    // Escape user-provided content to prevent XSS
    const escapedName = escapeHtml(name);
    const escapedDescription = escapeHtml(details.description);
    const escapedSchedule = escapeHtml(formatSchedule(details));
    
    // Create activity content
    activityEl.innerHTML = `
      <div class="calendar-activity-name">${escapedName}</div>
      <div class="calendar-activity-enrollment">${enrolled}/${maxParticipants}</div>
      <div class="calendar-tooltip">
        <div class="calendar-tooltip-title">${escapedName}</div>
        <div class="calendar-tooltip-content">
          <p><strong>Description:</strong> ${escapedDescription}</p>
          <p><strong>Schedule:</strong> ${escapedSchedule}</p>
          <p><strong>Enrollment:</strong> ${enrolled}/${maxParticipants} students</p>
          <p><strong>Spots Left:</strong> ${maxParticipants - enrolled}</p>
        </div>
      </div>
    `;
    
    return activityEl;
  }

  // Function to create activity card element (extracted from renderActivityCard)
  function createActivityCardElement(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    // Calculate spots and capacity
    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    // Determine capacity status class
    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    // Determine activity type
    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    // Format the schedule using the new helper function
    const formattedSchedule = formatSchedule(details);

    // Create activity tag
    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    // Create capacity indicator
    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    // Add click handlers for delete buttons
    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add click handler for register button (only when authenticated)
    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    return activityCard;
  }

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = createActivityCardElement(name, details);
    activitiesList.appendChild(activityCard);
  }

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current filter and display filtered activities
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to view mode buttons
  viewModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      viewModeButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update view mode
      viewMode = button.dataset.mode;

      // Update UI based on view mode
      const categoryFilterContainer = document.querySelector(".category-filter-container");
      const dayFilterContainer = document.querySelector(".day-filter-container");
      
      if (viewMode === "group" || viewMode === "calendar") {
        // Hide category filters in group and calendar mode
        categoryFilterContainer.style.display = "none";
        // Reset to "all" when switching to group or calendar mode
        currentFilter = "all";
        categoryFilters.forEach((btn) => {
          if (btn.dataset.category === "all") {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
      } else {
        // Show category filters in filter mode
        categoryFilterContainer.style.display = "block";
      }
      
      // In calendar mode, it's useful to keep day filters visible
      if (viewMode === "calendar") {
        dayFilterContainer.style.display = "block";
      }

      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current day filter and fetch activities
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current time filter and fetch activities
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    // Add slight delay to trigger animation
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  // Event listener for close button
  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    // Create the confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="confirm-button" class="confirm-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Style the buttons
      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    // Set the message
    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    // Show the dialog
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    // Handle button clicks
    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    // Remove any existing event listeners
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add new event listeners
    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    // Close when clicking outside
    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            // Refresh the activities list
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        // Refresh the activities list after successful signup
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Initialize app
  initializeDarkMode();
  checkAuthentication();
  initializeFilters();
  fetchActivities();
});
