// import React , { useContext, useState }  from 'react';
// import logo from '../assets/fsy_logo.png';
// import { Link, Outlet, useNavigate, Navigate } from 'react-router-dom';
// import { UserContext } from '../App';
// import MenuNavigationPanel from './menu-navigation.component';
// import { removeFromSession } from '../common/session';
// import { Toaster, toast } from 'react-hot-toast';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faBars } from '@fortawesome/free-solid-svg-icons'

// const Navbar = () => {
//     const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
//     const [menuNavPanel, setMenuNavPanel] = useState(false);
    

//     let navigate = useNavigate();
    
//     const {
//         userAuth: { access_token },
//         setUserAuth,
//     } = useContext(UserContext);


//     const signOutUser = async () => {
//         try {
//             const response = await fetch('/api/auth/logout', {
//                 method: 'DELETE',
//                 headers: {
//                     'Content-Type': 'application/json; charset=UTF-8',
//                 },
//             });
    
//             if (response.status === 204) {
//                 toast.success('로그아웃 되었습니다.');
//                 setUserAuth({ access_token: null });
//                 removeFromSession('user');
//                 removeFromSession('data');
//                 setTimeout(() => {
//                     window.location.href = '/';
//                 }, 1000);
//             } else {
//                 const res = await response.json();
//                 console.error(res.msg);
//                 toast.error(`로그아웃 실패: ${res.msg}`, {
//                     duration: 2000,
//                 });
//             }
//         } catch (error) {
//             console.error('Error during logout:', error);
//             toast.error('로그아웃 중 오류가 발생했습니다.', {
//                 duration: 2000,
//             });
//         }
//     };

//     const handleMenuNavPanel = () => {
//         setMenuNavPanel((currentVal) => !currentVal);
//     };

//     const handleSearch = (e) => {
//         let query = e.target.value;

//         if(e.keyCode == 13 && query.length) {
//             navigate(`/search/${query}`);
//         }
//     }

//     const handleBlur = () => {
//         setTimeout(() => {
//             setMenuNavPanel(false);
//         }, 200);
//     };
//     return (
//         <>
//             <nav className='navbar flex-items' style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
//             {access_token ? (
//                     <>
//                     <div
//                         className='relative'
//                         onClick={handleMenuNavPanel}
//                         onBlur={handleBlur}
//                     >
//                         <button className='w-12 h-12 mt-1 '>
//                             <FontAwesomeIcon icon={faBars } size="3x" />
//                         </button>
//                         {menuNavPanel ? <MenuNavigationPanel /> : ''}
//                     </div>
                    
//                     <div className='flex items-center gap-3 md:gap-6 ml-auto'></div>
//                     <button
//                         className='btn-dark text-left p-3 hover:bg-grey  py-3'
//                         onClick={() => signOutUser()}
//                     >
//                         <h1 className='font-bold text-base mg-1'>로그아웃</h1>
//                     </button>
//                     </>
//                 ) : (
//                 <>
//                     <Link to='/' className='flex-none w-20 mt-auto'>
//                         <img src={logo} className='w-full rounded-full' />
//                     </Link>
//                     <div className='flex items-center gap-3 md:gap-6 ml-auto'></div>
//                     <Link to='/signin' className='btn-dark py-2'>
//                         로그인
//                     </Link>
//                 </>
//                 )}
//             </nav>
//             <Toaster />
//             <div className="content">
//                 <Outlet />
//             </div>
//         </>
//     );
// };

// export default Navbar;

import React, { useContext, useState, useRef, useEffect } from 'react';
import logo from '../assets/fsy_logo.png';
import { Link, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { UserContext } from '../App';
import MenuNavigationPanel from './menu-navigation.component';
import { removeFromSession } from '../common/session';
import { Toaster, toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import zIndex from '@mui/material/styles/zIndex';

const Navbar = () => {
    const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
    const [menuNavPanel, setMenuNavPanel] = useState(false);
    const menuRef = useRef(null);

    let navigate = useNavigate();
    
    const {
        userAuth: { access_token },
        setUserAuth,
    } = useContext(UserContext);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuNavPanel(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleBlur = () => {
                setTimeout(() => {
                    setMenuNavPanel(false);
                }, 200);
            };

    const signOutUser = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
            });
    
            if (response.status === 204) {
                toast.success('로그아웃 되었습니다.');
                setUserAuth({ access_token: null });
                removeFromSession('user');
                removeFromSession('data');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                const res = await response.json();
                console.error(res.msg);
                toast.error(`로그아웃 실패: ${res.msg}`, {
                    duration: 2000,
                });
            }
        } catch (error) {
            console.error('Error during logout:', error);
            toast.error('로그아웃 중 오류가 발생했습니다.', {
                duration: 2000,
            });
        }
    };

    const handleMenuNavPanel = () => {
        setMenuNavPanel((currentVal) => !currentVal);
    };

    const handleSearch = (e) => {
        let query = e.target.value;

        if(e.keyCode == 13 && query.length) {
            navigate(`/search/${query}`);
        }
    }

    const navbarStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0
    };
    return (
        <>
            <nav className='navbar flex-items' style={{navbarStyle}}>
            {access_token ? (
                    <>
                    <div
                        className='relative'
                        onClick={handleMenuNavPanel}
                        onBlur={handleBlur}
                        ref={menuRef}
                    >
                        <button className='w-12 h-12 mt-1 '>
                            <FontAwesomeIcon icon={faBars } size="3x" />
                        </button>
                        {menuNavPanel ? <MenuNavigationPanel /> : ''}
                    </div>
                    
                    <div className='flex items-center gap-3 md:gap-6 ml-auto'></div>
                    <button
                        className='btn-dark text-left p-3 hover:bg-grey  py-3'
                        onClick={() => signOutUser()}
                    >
                        <h1 className='font-bold text-base mg-1'>로그아웃</h1>
                    </button>
                    </>
                ) : (
                <>
                    <Link to='/' className='flex-none w-20 mt-auto'>
                        <img src={logo} className='w-full rounded-full' />
                    </Link>
                    <div className='flex items-center gap-3 md:gap-6 ml-auto'></div>
                    <Link to='/signin' className='btn-dark py-2'>
                        로그인
                    </Link>
                </>
                )}
            </nav>
            <Toaster />
            <div className={!menuNavPanel ? 'sticky z-20' : ''}>
                <Outlet/>
            </div>
        </>
    );
};

export default Navbar;