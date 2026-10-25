import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import MovieDetails from './pages/MovieDetails';
import Bookings from './pages/Bookings';
import { Clapperboard, Instagram, Github } from 'lucide-react';
function Guard({children}){const {user,loading}=useAuth(),location=useLocation();if(loading)return <div className="loading-state app-loading">Getting things ready...</div>;return user?children:<Navigate to="/login" replace state={{from:location.pathname}}/>;}
function Layout(){const location=useLocation();return <><Navbar/><Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Auth/>}/><Route path="/register" element={<Auth/>}/><Route path="/movie/:id" element={<MovieDetails/>}/><Route path="/bookings" element={<Guard><Bookings/></Guard>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes><footer className="footer"><a className="brand" href="/"><span className="brand-icon"><Clapperboard size={18}/></span>i<span>MOVIES</span></a><p>Made for the love of cinema. <span>✦</span></p><span className="footer-copy">© {new Date().getFullYear()} IMovies · Movie nights, made easy.</span></footer></>}
export default function App(){return <BrowserRouter><AuthProvider><Layout/></AuthProvider></BrowserRouter>}
