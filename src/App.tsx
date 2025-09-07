import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PostPage } from './pages/PostPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { AuthPage } from './pages/AuthPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<HomePage />} />
                <Route path="/post/:slug" element={<PostPage />} />
                <Route path="/create" element={<CreatePostPage />} />
                <Route path="/edit/:id" element={<CreatePostPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;