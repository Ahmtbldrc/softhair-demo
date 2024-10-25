import { useReducer } from "react";

type Mail = {
    to: string;
    subject: string;
    html: string;
};

type State = {
    status: string;
};

type Action = {
    type: string;
};

const initialState: State = {
    status: 'idle',
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SEND_MAIL_SUCCESS':
            return { ...state, status: 'success' };
        case 'SEND_MAIL_ERROR':
            return { ...state, status: 'error' };
        default:
            return state;
    }
}

export default function useMail() {
    const [state, dispatch] = useReducer(reducer, initialState)
    
    const sendMail = async (mail: Mail) => {
        try {
            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: mail.to,
                  subject: mail.subject,
                  html: mail.html,
                }),
              });
            
              const data = await response.json();
              if (data.ok) {
                  dispatch({ type: "SEND_MAIL_SUCCESS" });
              } else {
                  dispatch({ type: "SEND_MAIL_ERROR" });
              }
        } catch (error) {
            console.log(error)
            dispatch({ type: "SEND_MAIL_ERROR" })
        }
    }
    
    return {
        state,
        sendMail,
    }
}
