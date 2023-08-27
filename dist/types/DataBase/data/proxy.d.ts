import { ILiveDataProxy, ILiveDataProxyValue, LiveDataProxyOptions } from "../../Types/Proxy";
import { DataReference } from "./reference";
import { IObservableLike } from "../../Types";
import type { ObjectCollection } from "../../Lib/ObjectCollection";
export declare function proxyAccess<ValueType>(proxiedValue: ValueType): ILiveDataProxyValue<ValueType>;
export declare class LiveDataProxy {
    /**
     * Creates a live data proxy for the given reference. The data of the reference's path will be loaded, and kept in-sync
     * with live data by listening for 'mutations' events. Any changes made to the value by the client will be synced back
     * to the database.
     * @param ref DataReference to create proxy for.
     * @param options proxy initialization options
     * be written to the database.
     */
    static create<T>(ref: DataReference, options?: LiveDataProxyOptions<T>): Promise<ILiveDataProxy<T>>;
}
/**
 * Provides functionality to work with ordered collections through a live data proxy. Eliminates
 * the need for arrays to handle ordered data by adding a 'sort' properties to child objects in a
 * collection, and provides functionality to sort and reorder items with a minimal amount of database
 * updates.
 */
export declare class OrderedCollectionProxy<ItemType extends {
    [KeyName in OrderKeyName]: number;
}, OrderKeyName extends string = "order"> {
    private collection;
    private orderProperty;
    private orderIncrement;
    constructor(collection: ObjectCollection<ItemType & {
        [KeyName in OrderKeyName]: number;
    }>, orderProperty?: OrderKeyName, orderIncrement?: number);
    /**
     * Gets an observable for the target object collection. Same as calling `collection.getObservable()`
     * @returns
     */
    getObservable(): IObservableLike<ObjectCollection<ItemType>>;
    /**
     * Gets an observable that emits a new ordered array representation of the object collection each time
     * the unlaying data is changed. Same as calling `getArray()` in a `getObservable().subscribe` callback
     * @returns
     */
    getArrayObservable(): IObservableLike<ItemType[]>;
    /**
     * Gets an ordered array representation of the items in your object collection. The items in the array
     * are proxied values, changes will be in sync with the database. Note that the array itself
     * is not mutable: adding or removing items to it will NOT update the collection in the
     * the database and vice versa. Use `add`, `delete`, `sort` and `move` methods to make changes
     * that impact the collection's sorting order
     * @returns order array
     */
    getArray(): ItemType[];
    /**
     * Adds or moves an item to/within the object collection and takes care of the proper sorting order.
     * @param item Item to add or move
     * @param index Optional target index in the sorted representation, appends if not specified.
     * @param from If the item is being moved
     * @returns
     */
    add(item: ItemType, index?: number, from?: number): {
        key: any;
        index: number;
    };
    /**
     * Deletes an item from the object collection using the their index in the sorted array representation
     * @param index
     * @returns the key of the collection's child that was deleted
     */
    delete(index: number): {
        key: string;
        index: number;
    };
    /**
     * Moves an item in the object collection by reordering it
     * @param fromIndex Current index in the array (the ordered representation of the object collection)
     * @param toIndex Target index in the array
     * @returns
     */
    move(fromIndex: number, toIndex: number): {
        key: any;
        index: number;
    };
    /**
     * Reorders the object collection using given sort function. Allows quick reordering of the collection which is persisted in the database
     * @param sortFn
     */
    sort(sortFn: (a: ItemType, b: ItemType) => number): void;
}
//# sourceMappingURL=proxy.d.ts.map