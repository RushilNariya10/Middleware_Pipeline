function Header({ name, themeColor }) {
  return (
    <header style={{ textAlign: "center" }}>
      <h1 style={{ color: themeColor }}>Student Portfolio</h1>
      <h2>{name}</h2>
      <p>B.Tech Information Technology Student</p>
    </header>
  );
}

export default Header;