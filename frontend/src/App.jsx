// import './App.css'
import React from 'react';
import { createContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lookInSession } from './common/session';
import HomePage from './pages/home.page';
import PageNotFound from './pages/404.page';
import Navbar from './components/navbar.component';
import MapPage from './pages/map.page.jsx';
import {CollapsibleTable} from './components/table.component.jsx';
import {Unauthenticated} from './login/unauthenticated.jsx';
import {TeamList} from './components/teams-management.page.jsx';
import {ActivityList} from './components/activities-management.page.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import InsertScores from './pages/insertScores.page.jsx';


export const UserContext = createContext({});

function App() {
  const [userAuth, setUserAuth] = useState(() => {
    const userInSession = lookInSession('user');
    return userInSession ? JSON.parse(userInSession) : { access_token: null };
  });

  useEffect(() => {
    let userInSession = lookInSession('user');

    userInSession
      ? setUserAuth(JSON.parse(userInSession))
      : setUserAuth({ access_token: null });
  }, []);

  return (
    <UserContext.Provider value={{ userAuth, setUserAuth }}>
        <Routes>
          <Route path='/' element={<Navbar />}>
            <Route index element={<HomePage />} />
            <Route path='/map' element={<MapPage />} />
            <Route path='/signin' element={<Unauthenticated />} />
            <Route path='/rank' element={<CollapsibleTable />} />
            <Route path='/team' element={<TeamList/>}/>
            <Route path='/activity' element={<ActivityList/>}/>
            <Route path='/insertScores' element={<InsertScores/>}/>
            <Route path='*' element={<PageNotFound />} />
          </Route>
        </Routes>
    </UserContext.Provider>
  )
}

export default App
