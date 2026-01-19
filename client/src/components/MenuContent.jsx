import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import { selectUser } from "../store/slices/userSlice";

// Define menu items - NO ROLE RESTRICTIONS
const menuItems = [
  { text: "Home", icon: <HomeRoundedIcon />, path: "/" },
  {
    text: "Branches",
    icon: <BusinessRoundedIcon />,
    path: "/branches",
    roles: ["admin", "hr"],
  },
  {
    text: "Employees",
    icon: <PeopleRoundedIcon />,
    path: "/employees",
    roles: ["admin", "hr"],
  },
  {
    text: "Approvals",
    icon: <CheckCircleOutlineIcon />,
    path: "/approvals",
    roles: ["admin", "manager", "approver"],
  },
  {
    text: "Bonuses",
    icon: <AttachMoneyIcon />,
    path: "/bonuses",
    roles: ["admin", "manager"],
  },
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRoundedIcon /> },
  { text: "About", icon: <InfoRoundedIcon /> },
  { text: "Feedback", icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);

  const handleNavigation = (path) => {
    if (path) {
      navigate(path);
    }
  };

  const visibleMenuItems = menuItems?.filter((item) =>
    item.roles ? item.roles.includes(user.role) : true,
  );

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {visibleMenuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
