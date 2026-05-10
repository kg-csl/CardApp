import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage'; 
import CardApp from './CardApp';
import AdminPanel from './AdminPanel';

export default function App() {
	return (
		<BrowserRouter>
		<Routes>
			<Route path="/" element={<LoginPage />} />
			<Route path="/user" element={<CardApp />} />
			<Route path="/admin" element={<AdminPanel />} />
			<Route path="*" element={
			<div><h1>Page not found.</h1></div>
			} />
		</Routes>
		</BrowserRouter>
	);
}
