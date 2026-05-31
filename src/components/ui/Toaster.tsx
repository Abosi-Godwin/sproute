import { Toaster } from "react-hot-toast";
const Toast = () => {
    return (
        <>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#18181b",
                        color: "#f4f4f5",
                        border: "1px solid #27272a",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontFamily: "Inter, sans-serif",
                        padding: "10px 14px",
                        maxWidth: "320px"
                    },
                    success: {
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#18181b"
                        }
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: "#f87171",
                            secondary: "#18181b"
                        }
                    }
                }}
            />
        </>
    );
};

export default Toast;
