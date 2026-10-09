// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Minimal non-Initializable logic contract. Forwards msg.value to `to`.
contract NativeForwarder {
    event Forwarded(address indexed to, uint256 amount);

    function forward(address to) external payable {
        (bool ok, ) = to.call{value: msg.value}("");
        require(ok, "forward failed");
        emit Forwarded(to, msg.value);
    }
}
