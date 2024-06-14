import { type FooterProps, Footer } from './Footer'
import { type HeaderProps, Header } from './Header'
import { type MainProps, Main } from './Main'
import { type NavProps, Nav } from './Nav'
import { NavItem, NavItemProps } from './NavItem'
import { NavItemList, NavItemListProps } from './NavItemList'
import { type ShellProps, Shell } from './Shell'
import { OpenModal, OpenModalProps } from './OpenModal'
import { DonateModal, DonateModalInterface } from './DonateModal'

export type AppProps = {
  Header: HeaderProps
  Shell: ShellProps
  Nav: NavProps
  Main: MainProps
  Footer: FooterProps
  NavItem: NavItemProps
  OpenModal: OpenModalProps
  NavItemList: NavItemListProps
  DonateModal: DonateModalInterface
}

export const App = {
  Header,
  Shell,
  Nav,
  NavItem,
  NavItemList,
  OpenModal,
  DonateModal,
  Main,
  Footer,
}

export { AppType } from './Header'
