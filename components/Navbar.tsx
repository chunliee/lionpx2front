import Link from "next/link"

const Navbar = () => {
  return (
    <div className="navbar py-6">
        <div className="container mx-auto px-4">
            <div className="navbar-box flex items-center justify-between">
            <div className="logo">
                <h1 className="text-3xl font-bold">ngodonf.</h1>
            </div>
            <ul className="menu flex items-center gap-12">
                <li className="">
                    <Link href="/">Home</Link>
                </li>
                 <li className="">
                    <Link href="/upload">Upload</Link>
                </li>
                {/* <li className="">
                    <Link href="/exporter">Export</Link>
                </li> */}
                 <li className="">
                    <Link href="/engine">Engine</Link>
                </li>
                 <li className="">
                    <Link href="/logs">Logs</Link>
                </li>

            </ul>
            <div className="md:hidden block">
                <i className="ri-menu-3-line ri-2x font-bold"></i>
            </div>
        </div>
        </div>
    </div>
  )
}

export default Navbar