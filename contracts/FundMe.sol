pragma solidity 0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__CallFailed();
error FundMe__InsufficientFunding();

/**
 * @title A contract for crowd funding
 * @author Daniil Ankushin
 * @notice FundMe contract is to leard blockchain dev tools
 * @dev This implements price feeds as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;
    address private immutable i_owner;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address _priceFeed) {
        s_priceFeed = AggregatorV3Interface(_priceFeed);
        i_owner = msg.sender;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice fund function fuds this contract
     */
    function fund() public payable {
        // require(msg.value.getConversionRate() >= MINIMUM_USD, "Didn't send enough");
        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert FundMe__InsufficientFunding();
        }
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        // require(callSuccess, "Call failed");
        if (!callSuccess) {
            revert FundMe__CallFailed();
        }
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 _funderIndex) public view returns (address) {
        return s_funders[_funderIndex];
    }

    function getAddressToAmountFunded(
        address _funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[_funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
