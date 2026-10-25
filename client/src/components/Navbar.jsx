import { Link, NavLink } from 'react-router-dom';
import { Clapperboard, Ticket, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function Navbar() {
 const { user, logout } = useAuth();
 return <header className="navbar"><Link className="brand" to="/"><span className="brand-icon"><Clapperboard size={21}/></span>i<span>MOVIES</span></Link><nav><NavLink to="/" end>Discover</NavLink>{user && <NavLink to="/bookings"><Ticket size={16}/> My tickets</NavLink>}</nav><div className="nav-actions">{user ? <><span className="hello">Hi, {user.name.split(' ')[0]}</span><button className="icon-button" title="Log out" onClick={logout}><LogOut size={18}/></button></> : <Link className="login-link" to="/login"><UserRound size={17}/> Sign in</Link>}</div></header>
}
