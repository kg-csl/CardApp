import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage'; 
import CardApp from './CardApp';

export default function App() {
	return (
		<BrowserRouter>
		<Routes>
			<Route path="/" element={<LoginPage />} />
			<Route path="/user" element={<CardApp />} />
			<Route path="*" element={
			<div><h1>Page not found.</h1></div>
			} />
		</Routes>
		</BrowserRouter>
	);
}
