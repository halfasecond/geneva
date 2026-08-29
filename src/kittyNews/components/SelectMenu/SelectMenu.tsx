type SelectMenuProps = {
    defaultValue: string;
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled: boolean;
    options: string[];
};

const SelectMenu: React.FC<SelectMenuProps> = ({ defaultValue, handleChange, disabled, options }) => {
    return (
        <select onChange={handleChange} {...{ defaultValue, disabled }}>
            {options.map((option: string, i: number) => (
                <option key={i} value={option}>
                    {option === 'p' ? 'paragraph' : option}
                </option>
            ))}
        </select>
    );
};

export default SelectMenu