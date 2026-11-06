import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Dashboard from './pages/Dashboard';

const Chapters = lazy(() => import('./pages/Chapters'));
const ChapterPage = lazy(() => import('./pages/ChapterPage'));
const Tutor = lazy(() => import('./pages/Tutor'));
const Solver = lazy(() => import('./pages/Solver'));
const Exercises = lazy(() => import('./pages/Exercises'));
const Graphs = lazy(() => import('./pages/Graphs'));
const Practice = lazy(() => import('./pages/Practice'));
const Progress = lazy(() => import('./pages/Progress'));
const Library = lazy(() => import('./pages/Library'));
const About = lazy(() => import('./pages/About'));

// HashRouter: compatible con GitHub Pages sin configuración de servidor.
export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="temas" element={<Chapters />} />
            <Route path="tema/:id" element={<ChapterPage />} />
            <Route path="tutor" element={<Tutor />} />
            <Route path="resolutor" element={<Solver />} />
            <Route path="ejercicios" element={<Exercises />} />
            <Route path="ejercicios/:id" element={<Exercises />} />
            <Route path="graficas" element={<Graphs />} />
            <Route path="practica" element={<Practice />} />
            <Route path="progreso" element={<Progress />} />
            <Route path="biblioteca" element={<Library />} />
            <Route path="acerca" element={<About />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
