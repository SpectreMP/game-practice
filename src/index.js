import React from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
    <Router>
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/profile" element={<UserProfile />} />
        </Routes>
    </Router>
);
