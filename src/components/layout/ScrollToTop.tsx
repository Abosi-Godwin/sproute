 import { useEffect } from "react";
import { useLocation } from "react-router";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const el = document.getElementById('main-content');
        if (el) {
            el.scrollTo({ top: 0, behavior: 'instant' });
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;