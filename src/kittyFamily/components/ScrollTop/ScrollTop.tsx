// @ts-nocheck
import React, { useEffect } from "react"
import { useLocation } from "react-router-dom"

const ScrollTop = (props) => {
  const { children } = props;

  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  return <>{children}</>
}

export default ScrollTop
