/**
 * AUTH GUARD - Route Protection & Session Expiration
 */

(function () {
    const userID = sessionStorage.getItem('userID');
    const loginTime = sessionStorage.getItem('loginTime'); 
    
    // 1. ROUTE PROTECTION: Redirect to login if no session exists
    if (!sessionStorage.getItem('isLoggedIn') || !userID) {
        window.location.href = "index.html";
        return;
    }

    // 2. SESSION EXPIRATION: Auto-logout after 30 minutes of inactivity
    const MAX_INACTIVITY = 30 * 60 * 1000; // 30 minutes
    const now = new Date().getTime();

    if (loginTime && (now - loginTime > MAX_INACTIVITY)) {
        alert("Your session has expired due to inactivity. Please login again.");
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }
    
    // Refresh the timestamp so the 30-minute timer starts over on this page load
    sessionStorage.setItem('loginTime', new Date().getTime());

})();