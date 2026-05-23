
import React, { useState } from 'react';
import Login from './Login';
import Lux from './Luxlab';
import AdminDashboard from './Admin';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleLoginSuccess = (role) => {
      console.log("handleLoginSuccess called with role:", role);
    console.log("role === 'admin'?", role === 'admin');
      console.log("APP.JS handleLoginSuccess called, role:", role);
    if (role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentPage('home');
  };

  if (currentPage === 'admin') {
    return (
      <AdminDashboard
        switchToUser={() => setCurrentPage('home')}
        onLogout={handleLogout} 
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setCurrentPage('home')}
      />
    );
  }

  return (
    <Lux onGoToLogin={() => setCurrentPage('login')} />
  );
}

export default App;  

/* App.js — had no role-based routing logic at all, just static routes
Luxlab.js — was handling its own login/routing internally, ignoring App.js completely, and reading localStorage too early before it was saved
AdminDashboard.js — had a double brace {{ syntax error breaking the useEffect
Login.js — was extracting data.token but your backend returns data.accessToken — the naming mismatch that caused the token to always be null */

/* 1. The <Router> (The Wrapper)
What it does: The <Router> (which you imported as BrowserRouter) is a "Context Provider." It keeps track of the browser's URL and listens for changes (like when you click a link).

Why it's necessary: It enables all the routing features (Routes, Route, and the useNavigate hook) to work. If you try to use navigation logic outside of this <Router> block, your app will throw an error because the tools won't know where they are.

2. The <Routes> (The Map)
What it does: It acts as a container for all your defined routes. It looks at the current URL and matches it against the list of <Route> children inside it.

How it works: It is designed to be "smart"—it will only render the first route that matches the URL.

3. The <Route> (The Destination)
Each <Route> defines a specific "path" and tells React which component to render:

<Route element="{<Login" path="/"/>} />:

When the user is at the root URL (e.g., http://localhost:3000/), it renders your Login component.

<Route element="{<AdminDashboard" path="/AdminDashboard"/>} />:

When the user navigates to http://localhost:3000/AdminDashboard, it swaps the Login screen out and renders your AdminDashboard component instead.

``:

The syntax `` is a JavaScript comment inside JSX. Because it is commented out, React is completely ignoring the UserDashboard route. If a user tries to visit /user-dashboard right now, they will see a blank page or a 404 error because you haven't "turned on" that route yet.

Summary of how this affects your App:
When your app first loads, it sees the URL is /, so it displays the Login page.

When your Login.jsx code executes navigate('/AdminDashboard') upon a successful login, the <Router> detects the URL change to /AdminDashboard.

The <Routes> component immediately sees the match and swaps the view to the AdminDashboard component without refreshing the page.

One Critical Troubleshooting Step
If you are still seeing a blank screen: Are you sure you have exported your components correctly?

In your AdminDashboard.jsx file, you must have an export statement at the bottom:

JavaScript
// Inside AdminDashboard.jsx
function AdminDashboard() {
  return <div>Welcome to Admin</div>;
}

export default AdminDashboard; // <--- This line is mandatory!
If you missed the export default in any of your components (Login, Admin, or UserDashboard), React won't be able to import them into App.jsx, which often results in a completely blank white screen. */