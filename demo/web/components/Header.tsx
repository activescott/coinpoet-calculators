import Link from "next/link"

const linkStyle = {
  marginRight: 15
}

const Header = () => (
  <div>
    <Link href="/">
      <a style={linkStyle}>Home</a>
    </Link>
    <Link href="/meanTimeBetweenBlocks?coin=zcash">
      <a style={linkStyle}>ZCash: Mean Time Between Blocks</a>
    </Link>
    <Link href="/meanTimeBetweenBlocks?coin=bitcoin">
      <a style={linkStyle}>Bitcoin: Mean Time Between Blocks</a>
    </Link>
  </div>
)

export default Header
