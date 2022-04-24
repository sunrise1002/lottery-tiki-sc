//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "abdk-libraries-solidity/ABDKMath64x64.sol";

contract Lottery is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMath for uint256;
    using ABDKMath64x64 for int128;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant DEALER = keccak256("DEALER");

    // ############
    // Initializer
    // ############
    function initialize(
        IERC20Upgradeable _token,
        uint256 _betAmount,
        uint256 _maxPlayer
    )
        public
        initializer
    {
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        token = _token;
        betAmount = _betAmount;
        maxPlayer = _maxPlayer;
        fee = ABDKMath64x64.divu(1, 10); // 10%
    }

    // ############
    // State
    // ############
    bool public isStop;
    int128 public fee;
    IERC20Upgradeable public token;
    uint256 public betAmount;
    uint256 public maxPlayer;
    uint256 public lotteryResult;

    EnumerableSet.AddressSet private players;
    mapping(uint256 => EnumerableSet.AddressSet) private bets;
    mapping(address => uint256) public winners;

    // ############
    // Events
    // ############
    event Bet(
        address indexed player,
        uint256 indexed betNumber
    );

    event Stop(
        bool isStop
    );

    event ClaimReward(
        address indexed winner,
        uint256 indexed reward
    );

    // ############
    // Modifiers
    // ############
    modifier restricted() {
        require(hasRole(DEALER, msg.sender), "Not dealer");
        _;
    }

    modifier isGameStopped() {
        require(isStop == false, "The game stopped");
        _;
    }

    // ############
    // Views
    // ############
    function isWinner(address _player) external view returns(bool) {
        return winners[_player] > 0;
    }

    // ############
    // Mutations
    // ############
    function bet(uint256 _betNumber)
        external
        isGameStopped
        {
            require(!players.contains(msg.sender), "Player has already bet");
            require(players.length() < maxPlayer, "Number players exceeded");
            require(!hasRole(DEALER, msg.sender), "Dealer can not be a player");
            require(0 <= _betNumber && 99 >= _betNumber, "Invalid bet number");

            players.add(msg.sender);
            bets[_betNumber].add(msg.sender);

            IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), betAmount);

            emit Bet(
                msg.sender,
                _betNumber
            );
        }

    function stopGame()
        external
        isGameStopped
        restricted
        nonReentrant
    {
        uint256 totalAmount = IERC20Upgradeable(token).balanceOf(address(this));

        isStop = true;

        uint256 result = block.number % 100;
        lotteryResult = result;

        uint256 numberWinners = bets[result].length();

        if (numberWinners == 0) {
            IERC20Upgradeable(token).transfer(msg.sender, totalAmount);
        } else {
            uint256 feeAmount = _getFee();
            uint256 rewardAmount = totalAmount.sub(feeAmount);

            IERC20Upgradeable(token).transfer(msg.sender, feeAmount);

            for (uint256 i = 0; i < numberWinners; i++) {
                winners[address(bets[result].at(i))] = rewardAmount.div(numberWinners);
            }
        }

        emit Stop(isStop);
    }

    function claimReward()
        external
        nonReentrant
    {
        require(isStop == true, "The game has not stopped yet");
        require(winners[msg.sender] > 0, "Insufficient balance");

        uint256 reward = winners[msg.sender];
        winners[msg.sender] = 0;

        IERC20Upgradeable(token).transfer(msg.sender, reward);

        emit ClaimReward(
            msg.sender,
            reward
        );
    }

    // ############
    // Internal helpers
    // ############
    function _getFee() private view returns(uint256) {
        return ABDKMath64x64.mulu(
            fee,
            IERC20Upgradeable(token).balanceOf(address(this))
        );
    }
}
