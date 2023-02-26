import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Disclosure } from '@headlessui/react';
import { Notification } from './Notification';
export const NotificationGroup = ({ notifications }) => {
    return (_jsx(Disclosure, { children: ({ open }) => {
            return (_jsxs("div", Object.assign({ className: "relative" }, { children: [notifications.length > 1 && open && (_jsx("div", { className: "absolute left-[33px] top-7 bottom-7 w-0.5 bg-gradient-to-b from-slate-700 to-blue" })), _jsx(Notification, { data: notifications[0], showExtra: notifications.length > 1 }), notifications.length > 1 && (_jsx(Disclosure.Panel, { children: notifications.map((el, idx) => {
                            if (idx > 0) {
                                return _jsx(Notification, { data: el, hideStatus: true }, idx);
                            }
                        }) }))] })));
        } }));
};
