// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// Minimal initializable transfer gate. Moves OKRW via the ERC20 surface so the
/// PCL value scan sees an ERC20 Transfer log. initialize(address) is 0xc4d66de8.
contract GwanmunGate {
    address public owner;
    bool private _init;

    function initialize(address o) external {
        require(!_init, "init");
        _init = true;
        owner = o;
    }

    function send(address to, uint256 amount) external {
        IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).transferFrom(msg.sender, to, amount);
    }
}
