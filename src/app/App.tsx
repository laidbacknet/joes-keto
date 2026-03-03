import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from '../features/dashboard/Dashboard';
import Meals from '../features/meals/Meals';
import MealEdit from '../features/meals/MealEdit';
import Plan from '../features/plan/Plan';
import Workouts from '../features/workouts/Workouts';
import WorkoutEdit from '../features/workouts/WorkoutEdit';
import Shopping from '../features/shopping/Shopping';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1>Joe's Keto</h1>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/meals">Meals</Link>
            <Link to="/plan">Plan</Link>
            <Link to="/workouts">Workouts</Link>
            <Link to="/shopping">Shopping</Link>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/meals/new" element={<MealEdit />} />
            <Route path="/meals/:id" element={<MealEdit />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/new" element={<WorkoutEdit />} />
            <Route path="/workouts/:id" element={<WorkoutEdit />} />
            <Route path="/shopping" element={<Shopping />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
