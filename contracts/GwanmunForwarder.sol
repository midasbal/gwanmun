// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Minimal initializable logic contract. initialize(address) has selector 0xc4d66de8.
contract GwanmunForwarder {
    address public owner;
    bool private _init;

    event Forwarded(address indexed to, uint256 amount);

    function initialize(address owner_) external {
        require(!_init, "init");
        _init = true;
        owner = owner_;
    }

    function forward(address to) external payable {
        (bool ok, ) = to.call{value: msg.value}("");
        require(ok, "fwd");
        emit Forwarded(to, msg.value);
    }
}
