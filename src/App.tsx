import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Posts from "@/pages/Posts";
import Accounts from "@/pages/Accounts";
import Live from "@/pages/Live";
import Platforms from "@/pages/Platforms";
import Trending from "@/pages/Trending";
import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/live" element={<Live />} />
          <Route path="/platforms" element={<Platforms />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/other" element={<div className="text-center text-xl">其他页面 - 敬请期待</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}
